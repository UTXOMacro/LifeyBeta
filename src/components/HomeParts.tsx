import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { greeting, initials, scoreColor } from '../lib/score';
import { mockFriends } from '../data/mock';
import type { ModuleId, Task } from '../types';
import { Avatar, GhostIconButton, GlassCard, ModuleChip, PulseRing } from './ui';
import { Sparkline } from './Sparkline';

// ─────────────────────────────────────────────────────────────
// Home composition — fixed curated layout matching Lifey-Home-01.
// Product rules preserved: Pulse = active modules only, off modules
// hidden from chips/tiles, single Done on the task row, no shame.
// ─────────────────────────────────────────────────────────────

// ── 1. Header ───────────────────────────────────────────
export function HomeHeader({ onOpenConnect }: { onOpenConnect: (seed?: string) => void }) {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  void onOpenConnect; // header uses bell + gear per the reference frame

  return (
    <header className="home-header">
      <button className="home-avatar-btn" onClick={() => navigate('/you')} aria-label="You">
        <Avatar label={initials(profile.displayName)} src={profile.photo} size={40} />
      </button>
      <div className="greeting">
        <span className="greeting-caption">{greeting()}</span>
        <span className="greeting-name">{profile.firstName}</span>
      </div>
      <div className="header-actions">
        <GhostIconButton label="Notifications">
          <BellIcon />
        </GhostIconButton>
        <GhostIconButton label="Settings" onClick={() => navigate('/you')}>
          <GearIcon />
        </GhostIconButton>
      </div>
    </header>
  );
}

// ── 2. Lifey Now card ───────────────────────────────────
export function NowCard({ onOpenConnect }: { onOpenConnect: (seed?: string) => void }) {
  const pulse = useStore((s) => s.pulse)();
  const lead =
    pulse >= 7
      ? "You're on a good run — sleep is steady."
      : pulse > 0
      ? 'Solid footing today.'
      : "You're in a fine place today.";
  const follow =
    pulse >= 7
      ? 'A short walk today keeps it going.'
      : pulse > 0
      ? 'One small move nudges you forward.'
      : 'Enjoy the day at your own pace.';
  const seed = `${lead} ${follow}`;

  return (
    <GlassCard className="now-card" onClick={() => onOpenConnect(seed)}>
      <span className="now-hairline" />
      <span className="now-lead">{lead}</span>
      <span className="now-follow">{follow}</span>
      <span className="now-ask">
        Ask <span className="now-arrow">→</span>
      </span>
    </GlassCard>
  );
}

// ── 3. Pulse card (hero) ────────────────────────────────
export function PulseCard({ onOpenConnect }: { onOpenConnect: (seed?: string) => void }) {
  const pulse = useStore((s) => s.pulse)();
  const active = useStore((s) => s.modules).filter((m) => m.enabled);

  return (
    <GlassCard className="pulse-card" onClick={() => onOpenConnect('Break down my Pulse for me.')}>
      <div className="pulse-ring-wrap">
        <PulseRing value={pulse} size={132} />
      </div>
      <div className="pulse-label">Pulse</div>
      <div className="pulse-value">{pulse.toFixed(1)}</div>
      <div className="pulse-chips">
        {active.map((m) => (
          <ModuleChip key={m.id}>{m.label}</ModuleChip>
        ))}
      </div>
    </GlassCard>
  );
}

// ── 4. Two-up metric tiles ──────────────────────────────
export function MetricTiles() {
  const scores = useStore((s) => s.scores);
  const tasks = useStore((s) => s.tasks);

  const scoresFor = (m: ModuleId) =>
    scores.filter((s) => s.module === m).slice(0, 7).reverse().map((s) => s.value1to10);

  const sleepVals = scoresFor('sleep');
  const sleepLatest = sleepVals[sleepVals.length - 1] ?? 0;

  // Tasks tile reflects what's queued today (mock: 2, walk up next).
  void tasks;

  return (
    <div className="tiles-row">
      <MetricTile
        icon={<MoonIcon />}
        label="Sleep"
        value="7h 12m"
        spark={sleepVals}
        sparkColor={scoreColor(sleepLatest)}
      />
      <MetricTile
        icon={<CheckIcon />}
        label="Tasks"
        value="2"
        subtitle="Evening walk next"
        spark={[2, 4, 3, 5, 6, 7, 9]}
        sparkColor="var(--mint)"
      />
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  subtitle,
  spark,
  sparkColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  spark: number[];
  sparkColor: string;
}) {
  return (
    <GlassCard className="metric-tile">
      <div className="tile-head">
        <span className="tile-icon">{icon}</span>
        <span className="tile-label">{label}</span>
      </div>
      <div className="tile-value">{value}</div>
      {subtitle && <div className="tile-subtitle">{subtitle}</div>}
      <div className="tile-spark">
        <Sparkline values={spark} color={sparkColor} width={130} height={28} />
      </div>
    </GlassCard>
  );
}

// ── 5. Week strip (on canvas, no heavy card) ────────────
export function WeekStrip() {
  const week = useStore((s) => s.week);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6

  return (
    <div className="week-strip">
      {days.map((d, i) => {
        const active = i === todayIdx;
        return (
          <div key={i} className={`week-day ${active ? 'active' : ''}`}>
            <span className="week-letter">{d}</span>
            <span className={`week-dot ${week[i] ? 'filled' : ''}`} />
          </div>
        );
      })}
    </div>
  );
}

// ── 6. Today (single Done control; max 2 rows on Home) ──
export function Today() {
  const tasks = useStore((s) => s.tasks);
  const setStatus = useStore((s) => s.setTaskStatus);
  const navigate = useNavigate();

  // Home shows a single focused row (max 2). Match the reference: one row.
  const primary = tasks[0];
  if (!primary) return null;

  return (
    <section id="today">
      <div className="section-row">
        <span className="section-label">Today</span>
        <button className="see-all" onClick={() => navigate('/connect')}>
          See all
        </button>
      </div>
      <div className="today-list">
        <TaskRow
          task={primary}
          onToggle={() => setStatus(primary.id, primary.status === 'done' ? 'open' : 'done')}
        />
      </div>
    </section>
  );
}

// TaskRow — check + title + a single mint Done pill. No Skip/Snooze on the row.
function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = task.status === 'done';
  return (
    <div className="task-row glass">
      <button
        className={`task-check ${done ? 'done' : ''}`}
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
      >
        {done && <CheckMark />}
      </button>
      <span className="task-title">{task.title.split(',')[0]}</span>
      <button className={`task-done ${done ? 'is-done' : ''}`} onClick={onToggle}>
        Done
      </button>
    </div>
  );
}

// ── 7. Friends peek ─────────────────────────────────────
export function FriendsPeek() {
  const navigate = useNavigate();
  const friends = mockFriends;
  const first = friends[0];
  const rest = friends.slice(1);

  return (
    <section>
      <div className="section-row">
        <span className="section-label">Friends</span>
        <button className="see-all" onClick={() => navigate('/friends')}>
          See all
        </button>
      </div>
      <button className="friends-peek" onClick={() => navigate('/friends')}>
        <span className="friend-lead">
          <Avatar label={initials(first.name)} src={first.avatar} size={44} />
          <span className="friend-lead-name">{first.name}</span>
        </span>
        <span className="friend-rest">
          {rest.map((f) => (
            <span key={f.id} className="friend-rest-avatar">
              <Avatar label={initials(f.name)} src={f.avatar} size={40} ring={false} />
            </span>
          ))}
        </span>
      </button>
    </section>
  );
}

// ── Inline icons (stroke = currentColor) ────────────────
const svgProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...svgProps}>
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...svgProps}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...svgProps}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...svgProps}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" />
    </svg>
  );
}
function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06110e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4 4 10-10.5" />
    </svg>
  );
}
