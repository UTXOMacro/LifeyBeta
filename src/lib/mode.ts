import type { LifeyMode, ModeState, ModuleConfig, PulseTrend, Score, Task } from '../types';
import { pulseValue } from './pulse';

// ─────────────────────────────────────────────────────────────
// Involvement mode engine — Build / Cruise / Recovery (PRD).
//
// This is an INTERNAL signal, not a UI tab. It answers one question:
// "How involved should Lifey be right now?"
//
//   Build    — the user is actively changing something. Be more involved:
//              education, planning, small experiments, reminders, systems.
//   Cruise   — things are working. Stay out of the way: passive learning,
//              occasional insight, available on demand. Cruise is the goal.
//   Recovery — life happened. Become more involved again, gently: no
//              judgment, simplify, easiest next action, rebuild momentum.
//
// Principles baked in:
//   • Bias toward Cruise when unsure (never manufacture reasons to engage).
//   • One rough day does not trigger Recovery — look at a trend/run.
//   • Derived fresh from real signals; nothing is stored or sticky.
//   • Transparent: every decision carries a plain-language reason.
// ─────────────────────────────────────────────────────────────

const RECENT_DAYS = 7; // window we look back over
const BUILD_ACTIVITY = 6; // signals in the window that read as "actively working"
const LOW_PULSE = 5.5; // a day at/below this reads as a struggling day
const RECOVERY_DROP = 1.5; // Pulse falling this much vs. the prior week = disrupted

function isoMinus(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Derive the current involvement mode from real signals:
 *   - Pulse now vs. the prior week (trend)
 *   - how many days in the recent window read as low (a struggling run)
 *   - how much the user is actively logging (engagement volume)
 *   - recently skipped tasks (friction / things slipping)
 *
 * Returns a transparent ModeState (mode + reason + confidence + signals).
 */
export function deriveMode(
  modules: ModuleConfig[],
  scores: Score[],
  tasks: Task[],
  today = new Date().toISOString().slice(0, 10),
): ModeState {
  const windowStart = isoMinus(RECENT_DAYS);
  const priorStart = isoMinus(RECENT_DAYS * 2);

  const recentScores = scores.filter((s) => s.date >= windowStart);
  const priorScores = scores.filter((s) => s.date >= priorStart && s.date < windowStart);

  // Pulse now vs. the prior week (only count prior if we actually had data).
  const pulseNow = pulseValue(modules, scores, today);
  const pulsePrior = priorScores.length
    ? pulseValue(modules, [...priorScores], isoMinus(RECENT_DAYS))
    : null;
  const drop = pulsePrior != null ? pulsePrior - pulseNow : 0;

  // How many recent DAYS looked low (a run of struggle, not one bad day).
  const lowDays = countLowDays(modules, scores, today);

  // Engagement volume — are they actively working the system?
  const activityCount = recentScores.length;

  // Things slipping — tasks skipped recently (friction signal).
  const skipped = tasks.filter((t) => t.status === 'skipped').length;

  const signals: string[] = [];
  signals.push(`pulse now ${pulseNow.toFixed(1)}${pulsePrior != null ? ` vs prior ${pulsePrior.toFixed(1)}` : ''}`);
  signals.push(`${activityCount} signals / ${RECENT_DAYS}d`);
  signals.push(`${lowDays} low day(s)`);
  if (skipped) signals.push(`${skipped} skipped task(s)`);

  // Direction vs. prior week — shared by every mode so Pulse framing is
  // grounded in the same trend (no new score, no extra math). A small band
  // around 0 counts as "steady" so normal noise doesn't read as a swing.
  const trend: PulseTrend =
    pulsePrior == null
      ? 'new'
      : drop <= -0.4
      ? 'up'
      : drop >= 0.4
      ? 'down'
      : 'steady';

  // ── Recovery: a real downturn, not scattered noise. We require that the
  // CURRENT state is actually struggling (Pulse itself is low), so one rough
  // night inside a good week never triggers it. "A rough day does not erase
  // what they built." Two independent paths in:
  //   1) a clear week-over-week drop that also lands Pulse in low territory
  //   2) a struggling run: Pulse is low now AND multiple recent low days
  //   3) friction: several tasks skipped recently
  const strugglingNow = pulseNow > 0 && pulseNow <= LOW_PULSE;
  const realDrop = pulsePrior != null && drop >= RECOVERY_DROP && pulseNow < pulsePrior - 0.5;
  const strugglingRun = strugglingNow && lowDays >= 3;
  const disrupted = realDrop || strugglingRun || skipped >= 3;
  if (disrupted) {
    const reason = realDrop
      ? 'Things dipped from last week — easing back in, no pressure.'
      : strugglingRun
      ? 'A few harder days in a row — let’s keep it simple and rebuild gently.'
      : 'A few things slipped — no judgment, just the easiest next step.';
    return { mode: 'recovery', reason, confidence: clamp01(0.5 + drop / 6 + lowDays * 0.06), signals, trend };
  }

  // ── Build: actively working AND not struggling. User is changing something.
  const buildish = activityCount >= BUILD_ACTIVITY && pulseNow >= LOW_PULSE;
  if (buildish) {
    return {
      mode: 'build',
      reason: 'You’re putting in the work right now — I’ll stay close and help.',
      confidence: clamp01(0.4 + (activityCount - BUILD_ACTIVITY) * 0.06),
      signals,
      trend,
    };
  }

  // ── Cruise: the default / destination. Things are fine; stay out of the way.
  // Low confidence anywhere above also lands here by design.
  const steadyGood = pulseNow >= LOW_PULSE || pulseNow === 0; // 0 = not enough data yet
  return {
    mode: 'cruise',
    reason: steadyGood
      ? 'Things are steady — I’ll keep out of the way and be here when you need me.'
      : 'Keeping it light for now — reach out anytime.',
    confidence: steadyGood ? 0.6 : 0.4,
    signals,
    trend,
  };
}

// Count recent days whose recomputed Pulse (as of that day) read as low.
// Only counts days that actually had signals, so silence is never punished.
function countLowDays(modules: ModuleConfig[], scores: Score[], today: string): number {
  let low = 0;
  for (let i = 0; i < RECENT_DAYS; i++) {
    const day = isoMinus(i);
    if (day > today) continue;
    const hadSignal = scores.some((s) => s.date === day);
    if (!hadSignal) continue;
    const known = scores.filter((s) => s.date <= day);
    const p = pulseValue(modules, known, day);
    if (p > 0 && p <= LOW_PULSE) low++;
  }
  return low;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Math.round(n * 100) / 100));

// ─────────────────────────────────────────────────────────────
// How involvement expresses itself. Keep this the single place that maps
// mode → tone, so copy stays consistent wherever we surface it.
// ─────────────────────────────────────────────────────────────

export interface ModeVoice {
  /** short label for internal/debug surfaces */
  label: string;
  /** how prominent Lifey's nudges should be (drives UI emphasis later) */
  involvement: 'high' | 'light';
  /** opening half of a "Lifey Now" line — paired with a concrete follow-up */
  lead: (firstName: string) => string;
}

// ─────────────────────────────────────────────────────────────
// Pulse FRAMING by mode. The number is NEVER changed by mode — only how
// it's presented. This keeps Pulse trustworthy while letting it feel
// intelligent: steady in Cruise, directional in Build, de-emphasized (the
// supportive line leads) in Recovery so a low day never reads as a verdict.
// ─────────────────────────────────────────────────────────────
export interface ModePulseFraming {
  /** short status word under the number */
  status: string;
  /** one calm line of context beneath the ring / caption */
  subtext: string;
  /** Recovery softens the number so the supportive line leads, not the score */
  softenNumber: boolean;
}

// Trend → a tiny human label (arrow handled in the component).
export function trendLabel(trend: PulseTrend): string {
  switch (trend) {
    case 'up':
      return 'trending up';
    case 'down':
      return 'easing off';
    case 'steady':
      return 'steady';
    case 'new':
      return 'getting to know you';
  }
}

export function pulseFraming(mode: LifeyMode, trend: PulseTrend): ModePulseFraming {
  if (mode === 'recovery') {
    return {
      status: 'rebuilding',
      subtext: 'Not a verdict — just where today starts. One small step is plenty.',
      softenNumber: true,
    };
  }
  if (mode === 'build') {
    return {
      status: trend === 'up' ? 'building' : 'on it',
      subtext:
        trend === 'up'
          ? 'Momentum is going your way — keep the small wins coming.'
          : 'You’re putting in the work. It adds up.',
      softenNumber: false,
    };
  }
  // Cruise — calm, glanceable, never attention-seeking.
  return {
    status: trend === 'new' ? 'settling in' : 'steady',
    subtext:
      trend === 'new'
        ? 'Still learning your rhythm — this will sharpen over time.'
        : 'Things are in a good rhythm. Nothing needed from you.',
    softenNumber: false,
  };
}

export const MODE_VOICE: Record<LifeyMode, ModeVoice> = {
  build: {
    label: 'Build',
    involvement: 'high',
    lead: () => 'You’re building momentum.',
  },
  cruise: {
    label: 'Cruise',
    involvement: 'light',
    lead: () => 'You’re in a good rhythm.',
  },
  recovery: {
    label: 'Recovery',
    involvement: 'high',
    lead: (name) => `We’ve got this, ${name}.`,
  },
};
