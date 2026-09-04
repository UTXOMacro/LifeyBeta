import type { ModuleConfig, ModuleId, PulsePart, Score } from '../types';

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
  const byModule = new Map<ModuleId, LatestScore>();
  for (const s of scores) {
    const cur = byModule.get(s.module);
    if (!cur) {
      byModule.set(s.module, { value: s.value1to10, date: s.date });
      continue;
    }
    // Prefer today's reading; otherwise keep the newest date.
    if (s.date === today || s.date > cur.date) {
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
