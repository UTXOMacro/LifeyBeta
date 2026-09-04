import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { pulseHistory, sourceLabel } from '../lib/pulse';
import type { HistoryPoint } from '../lib/pulse';
import type { ScoreSource } from '../types';
import { SettingsHeader } from './settings/SettingsHeader';

const WINDOWS = [1, 5, 14, 30] as const;

// Pulse History — chart of Pulse over 1/5/14/30 days, plus the entries that
// moved it and how each one arrived (chat, moment, grocery, Strava, device).
export function PulseHistoryScreen() {
  const navigate = useNavigate();
  const modules = useStore((s) => s.modules);
  const scores = useStore((s) => s.scores);

  const [win, setWin] = useState<number>(14);

  const history = useMemo(
    () => pulseHistory(modules, scores, win),
    [modules, scores, win],
  );

  const current = history[history.length - 1]?.value ?? 0;
  const first = history.find((p) => p.value > 0)?.value ?? current;
  const delta = Math.round((current - first) * 10) / 10;

  // Flatten entries (most recent first) for the "how it registered" list.
  const entries = useMemo(() => {
    const rows = history
      .flatMap((p) => p.entries.map((e) => ({ ...e, date: p.date })))
      .reverse();
    return rows;
  }, [history]);

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="Pulse History" onBack={() => navigate('/you')} />

      {/* Window tabs */}
      <div className="hist-tabs">
        {WINDOWS.map((w) => (
          <button
            key={w}
            className={`hist-tab ${win === w ? 'active' : ''}`}
            onClick={() => setWin(w)}
          >
            {w}d
          </button>
        ))}
      </div>

      {/* Summary + chart */}
      <div className="hist-summary">
        <div className="hist-now">{current.toFixed(1)}</div>
        <div className="hist-delta">
          <span className={delta >= 0 ? 'up' : 'down'}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
          </span>
          <span className="faint"> over {win}d</span>
        </div>
      </div>

      <PulseChart history={history} />

      {/* Legend of input sources present in this window */}
      <SourceLegend history={history} />

      {/* How it registered — entry list with provenance */}
      <div className="section-row">
        <span className="section-label">How it registered</span>
      </div>
      <div className="hist-entries">
        {entries.length === 0 && (
          <div className="faint hist-empty">No inputs in this window yet.</div>
        )}
        {entries.map((e, i) => (
          <div key={i} className="hist-entry">
            <span className={`hist-src src-${e.source}`}>{sourceLabel(e.source)}</span>
            <div className="hist-entry-main">
              <span className="hist-entry-title">
                {e.label} · {e.value}/10
              </span>
              {e.note && <span className="hist-entry-note faint">{e.note}</span>}
            </div>
            <span className="hist-entry-date faint">{shortDate(e.date)}</span>
          </div>
        ))}
      </div>

      <p className="settings-helper faint">
        Pulse is recomputed each day from the signals you opted into. Inputs arrive from
        Connect, moments, grocery orders, and connected apps like Strava — never a diagnosis.
      </p>
    </div>
  );
}

// ── SVG line + area chart ───────────────────────────────
function PulseChart({ history }: { history: HistoryPoint[] }) {
  const W = 320;
  const H = 150;
  const padX = 6;
  const padY = 14;

  const pts = history.map((p, i) => {
    const x = padX + (i * (W - 2 * padX)) / Math.max(1, history.length - 1);
    const y = padY + (1 - p.value / 10) * (H - 2 * padY);
    return { x, y, p };
  });

  const line = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1]?.x ?? padX} ${H - padY} L ${pts[0]?.x ?? padX} ${H - padY} Z`;
  const last = pts[pts.length - 1];

  return (
    <div className="hist-chart glass">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="histFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--mint)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines at 2/5/8 */}
        {[2, 5, 8].map((g) => {
          const y = padY + (1 - g / 10) * (H - 2 * padY);
          return <line key={g} x1={padX} y1={y} x2={W - padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        {pts.length > 1 && <path d={area} fill="url(#histFill)" />}
        {pts.length > 1 && (
          <path d={line} fill="none" stroke="var(--mint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {/* dots on days that had input */}
        {pts.map((pt, i) =>
          pt.p.entries.length > 0 ? (
            <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="var(--mint)" />
          ) : null,
        )}
        {last && <circle cx={last.x} cy={last.y} r="4.5" fill="var(--mint)" stroke="var(--canvas)" strokeWidth="2" />}
      </svg>
      <div className="hist-axis">
        <span className="faint">{shortDate(history[0]?.date)}</span>
        <span className="faint">{shortDate(history[history.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

// ── Source legend ───────────────────────────────────────
function SourceLegend({ history }: { history: HistoryPoint[] }) {
  const sources = new Set<ScoreSource>();
  history.forEach((p) => p.entries.forEach((e) => sources.add(e.source)));
  if (sources.size === 0) return null;
  return (
    <div className="hist-legend">
      {[...sources].map((s) => (
        <span key={s} className={`hist-src src-${s}`}>
          {sourceLabel(s)}
        </span>
      ))}
    </div>
  );
}

function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
