import type { ModuleConfig, ModuleId, PulsePart, Score, ScoreSource } from '../types';

// ─────────────────────────────────────────────────────────────
// Pulse engine — single source of truth for Home + You.
//
// Pulse estimates how supported today looks from signals the user
// opted into. Not a diagnosis. Off modules have weight 0 and are
// excluded entirely. Weights renormalize across enabled modules.
//
//   Pulse = Σ (score × weight × confidence) / Σ (weight × confidence)
//
// No data in 7 days → confidence shrinks toward 0 (we never invent a
// punitive low score for silence).
// ─────────────────────────────────────────────────────────────

const STALE_DAYS = 7;

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00');
  const b = new Date(bIso + 'T00:00:00');
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 86_400_000));
}

// Confidence decays with staleness: fresh (~today) = 1, then linear to
// 0 by STALE_DAYS. Missing data => 0 confidence (contributes nothing).
function confidenceFor(latestDate: string | undefined, today: string): number {
  if (!latestDate) return 0;
  const age = daysBetween(latestDate, today);
  if (age <= 0) return 1;
  if (age >= STALE_DAYS) return 0.15; // still a whisper, never punitive
  return 1 - (age / STALE_DAYS) * 0.85;
}

interface LatestScore {
  value: number;
  date: string;
}

// Latest score per module (prefers today's, else the most recent entry).
function latestByModule(scores: Score[], today: string): Map<ModuleId, LatestScore> {
  // scores are newest-first (new entries are prepended), so the FIRST time we
  // see a module is its most recent reading. Only replace with a strictly
  // newer date, so multiple same-day writes keep the latest (first-seen) one.
  const byModule = new Map<ModuleId, LatestScore>();
  void today;
  for (const s of scores) {
    const cur = byModule.get(s.module);
    if (!cur) {
      byModule.set(s.module, { value: s.value1to10, date: s.date });
      continue;
    }
    if (s.date > cur.date) {
      byModule.set(s.module, { value: s.value1to10, date: s.date });
    }
  }
  return byModule;
}

/**
 * Build the weighted composition (enabled modules only), with renormalized
 * weights. This is what the You "Your Pulse model" card renders.
 */
export function pulseParts(
  modules: ModuleConfig[],
  scores: Score[],
  today = new Date().toISOString().slice(0, 10),
): PulsePart[] {
  const enabled = modules.filter((m) => m.enabled);
  const latest = latestByModule(scores, today);

  const rawWeight = enabled.reduce((sum, m) => sum + m.weight, 0) || 1;

  return enabled.map((m) => {
    const l = latest.get(m.id);
    return {
      module: m.id,
      label: m.label,
      score: l?.value,
      confidence: confidenceFor(l?.date, today),
      weight: m.weight / rawWeight, // renormalized fraction
    };
  });
}

/**
 * Compute Pulse from the composition parts. Weighted by (weight × confidence)
 * so stale/empty modules quietly contribute less rather than dragging the
 * number down. Returns 0 when nothing is known yet.
 */
export function computePulse(parts: PulsePart[]): number {
  let num = 0;
  let den = 0;
  for (const p of parts) {
    if (p.score == null) continue;
    const w = p.weight * p.confidence;
    num += p.score * w;
    den += w;
  }
  if (den === 0) return 0;
  return Math.round((num / den) * 10) / 10;
}

// Convenience: full pipeline from raw state to a Pulse number.
export function pulseValue(
  modules: ModuleConfig[],
  scores: Score[],
  today = new Date().toISOString().slice(0, 10),
): number {
  return computePulse(pulseParts(modules, scores, today));
}

// ─────────────────────────────────────────────────────────────
// Pulse History — recompute Pulse for each day in a window using only the
// scores known up to that day. Each point also lists the entries that landed
// that day with their input source (chat/moment/grocery/strava/etc).
// ─────────────────────────────────────────────────────────────

export interface HistoryEntry {
  module: ModuleId;
  label: string;
  value: number;
  source: ScoreSource;
  note?: string;
}

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  value: number; // Pulse that day (0 if nothing known yet)
  entries: HistoryEntry[]; // signals that landed on this day
}

function isoMinus(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function pulseHistory(
  modules: ModuleConfig[],
  scores: Score[],
  windowDays: number,
  today = new Date().toISOString().slice(0, 10),
): HistoryPoint[] {
  const labelFor = new Map(modules.map((m) => [m.id, m.label] as const));
  const points: HistoryPoint[] = [];

  for (let i = windowDays - 1; i >= 0; i--) {
    const day = isoMinus(i);
    // Scores known as of `day` (nothing from the future).
    const known = scores.filter((s) => s.date <= day);
    const value = computePulse(pulseParts(modules, known, day));
    const entries: HistoryEntry[] = scores
      .filter((s) => s.date === day)
      .map((s) => ({
        module: s.module,
        label: labelFor.get(s.module) ?? s.module,
        value: s.value1to10,
        source: s.source,
        note: s.note,
      }));
    points.push({ date: day, value, entries });
  }
  void today;
  return points;
}

// Human label for an input source (Pulse History legend).
export function sourceLabel(source: ScoreSource): string {
  switch (source) {
    case 'chat':
      return 'Connect chat';
    case 'moment':
      return 'Moment';
    case 'grocery':
      return 'Grocery order';
    case 'strava':
      return 'Strava';
    case 'device':
      return 'Device';
    case 'manual':
      return 'Manual';
    case 'inferred':
      return 'Inferred';
    default:
      return source;
  }
}
