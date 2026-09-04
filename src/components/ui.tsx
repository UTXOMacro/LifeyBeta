import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

// ─────────────────────────────────────────────────────────────
// Shared visual system. Every screen composes from these so
// Home / Friends / Capture / Connect / You look like one product.
// Tokens live in theme.css — no second color system here.
// ─────────────────────────────────────────────────────────────

/** AppScaffold — canvas + header glow + floating tab bar. */
export function AppScaffold({
  children,
  onCapture,
}: {
  children: ReactNode;
  onCapture: () => void;
}) {
  return (
    <div className="scaffold">
      <div className="scaffold-scroll">{children}</div>
      <BottomNav onCapture={onCapture} />
    </div>
  );
}

/** GlassCard — frosted blur, hairline border, card radius. */
export function GlassCard({
  children,
  className = '',
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const cls = `glass ${className}`.trim();
  if (onClick) {
    return (
      <button className={cls} onClick={onClick} style={style}>
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

/** Avatar — circular, optional mint ring, letter or image. */
export function Avatar({
  label,
  src,
  size = 40,
  ring = true,
}: {
  label: string;
  src?: string;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        border: ring ? undefined : '1px solid var(--card-border)',
      }}
    >
      {src ? <img src={src} alt={label} /> : label}
    </span>
  );
}

/** MintButton — primary mint pill, or ghost (mint-dim) variant. */
export function MintButton({
  children,
  onClick,
  ghost = false,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  ghost?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={`mint-btn ${ghost ? 'ghost' : ''} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** GhostIconButton — 40pt tappable icon, no chrome. */
export function GhostIconButton({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
}) {
  return (
    <button className="ghost-icon-btn" onClick={onClick} aria-label={label}>
      {children}
    </button>
  );
}

/** ModuleChip — dark pill, 1px border, 12pt label. */
export function ModuleChip({ children }: { children: ReactNode }) {
  return <span className="module-chip">{children}</span>;
}

/** ChevronRow — leading icon · label · trailing chevron. Pushes a screen. */
export function ChevronRow({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button className="chevron-row" onClick={onClick}>
      <span className="chevron-icon">{icon}</span>
      <span className="chevron-label">{label}</span>
      <span className="chevron-caret">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

/** PulseRing — full thin track ring with a mint gradient that is bright at the
 *  top/upper-right and fades clockwise toward the lower-left (matches ref). */
export function PulseRing({ size = 132 }: { value?: number; max?: number; size?: number }) {
  const stroke = Math.round(size * 0.035); // ~3.5% of diameter — hairline
  const r = (size - stroke) / 2;
  const gid = 'pulseGrad';

  return (
    <svg
      className="pulse-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <defs>
        {/* Bright at top-right (x2,y1 corner), fading to bottom-left */}
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.04" />
          <stop offset="45%" stopColor="var(--mint)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      {/* full circle, thin gradient stroke */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}
