// Calm scale mapped onto the mint accent (no red/green pass-fail).
// Everything reads as a single mint family per the shared visual system.
export function scoreColor(v: number): string {
  if (v <= 0) return 'var(--text-muted)';
  if (v < 4) return 'rgba(125, 207, 192, 0.45)';
  if (v < 6) return 'rgba(125, 207, 192, 0.65)';
  return 'var(--mint)';
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// initials for avatar placeholders
export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
