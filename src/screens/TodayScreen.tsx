import { useStore } from '../store';
import { greeting } from '../lib/score';
import { GlassCard } from '../components/ui';
import type { Task } from '../types';
import { NowCard, WeekStrip } from '../components/HomeParts';

// Today — "what matters most today." A few useful actions, not a dashboard.
// PRD: useful in ~30 seconds. No Pulse hero, no Friends, no charts.
// Max 3 actions. Done / Skip / Snooze with no punishment for skipping.
export function TodayScreen({ onOpenConnect }: { onOpenConnect: (seed?: string) => void }) {
  const profile = useStore((s) => s.profile);
  const tasks = useStore((s) => s.tasks);
  const setStatus = useStore((s) => s.setTaskStatus);

  // Keep Today glanceable — show the few that matter, cap at 3.
  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'skipped').slice(0, 3);
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="today-screen">
      <header className="today-head">
        <span className="today-caption">{greeting()}</span>
        <h1 className="today-name">{profile.firstName}</h1>
      </header>

      <NowCard onOpenConnect={onOpenConnect} />

      <section className="today-actions">
        <div className="section-row">
          <span className="section-label">Today</span>
          <button className="see-all" onClick={() => onOpenConnect('What should I focus on today?')}>
            Ask Lifey
          </button>
        </div>

        {open.length === 0 ? (
          <GlassCard className="today-empty">
            <span className="today-empty-line">You're all set for today.</span>
            <span className="today-empty-sub">
              {doneCount > 0 ? 'Nice — the rest is yours to live.' : 'Nothing pressing. Enjoy it.'}
            </span>
          </GlassCard>
        ) : (
          <div className="today-list">
            {open.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDone={() => setStatus(task.id, 'done')}
                onSkip={() => setStatus(task.id, 'skipped')}
                onSnooze={() => setStatus(task.id, 'snoozed')}
              />
            ))}
          </div>
        )}
      </section>

      <WeekStrip />
    </div>
  );
}

// A single today action: title + Done / Skip / Snooze. Skipping is not a failure.
function TaskCard({
  task,
  onDone,
  onSkip,
  onSnooze,
}: {
  task: Task;
  onDone: () => void;
  onSkip: () => void;
  onSnooze: () => void;
}) {
  return (
    <GlassCard className="today-card">
      <span className="today-card-title">{task.title.split(',')[0]}</span>
      <div className="today-card-actions">
        <button className="today-chip primary" onClick={onDone}>
          Done
        </button>
        <button className="today-chip" onClick={onSnooze}>
          Later
        </button>
        <button className="today-chip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </GlassCard>
  );
}
