import { useStore } from '../store';
import { initials } from '../lib/score';
import { Avatar, GlassCard } from '../components/ui';
import type { Visibility } from '../types';

const PRIVACY_OPTS: { id: Visibility; label: string }[] = [
  { id: 'me', label: 'Only me' },
  { id: 'friends', label: 'Friends' },
  { id: 'everyone', label: 'Everyone' },
];

// You — identity glass card, module rows with switches, links. No Pulse hero.
export function YouScreen() {
  const profile = useStore((s) => s.profile);
  const modules = useStore((s) => s.modules);
  const toggleModule = useStore((s) => s.toggleModule);

  return (
    <div className="screen">
      <h1 className="screen-title">You</h1>

      {/* Identity card */}
      <GlassCard className="you-profile">
        <Avatar label={initials(profile.displayName)} size={56} />
        <div className="you-id">
          <div className="you-name">{profile.displayName}</div>
          <div className="you-living faint">{profile.howImLiving}</div>
        </div>
      </GlassCard>

      {/* Module rows — off = hidden from picker, Pulse, Home */}
      <div className="section-row">
        <span className="section-label">Modules</span>
      </div>
      <div className="module-list">
        {modules.map((m) => (
          <GlassCard key={m.id} className="module-row">
            <span className="module-name">{m.label}</span>
            <button
              className={`switch ${m.enabled ? 'on' : ''}`}
              onClick={() => toggleModule(m.id)}
              aria-label={`Toggle ${m.label}`}
            >
              <span className="knob" />
            </button>
          </GlassCard>
        ))}
      </div>
      <p className="module-hint faint">
        Off modules disappear from your picker, Pulse, and Home. Turn one on to see its tile.
      </p>

      {/* Links */}
      <div className="you-links">
        <GlassCard className="you-link">Edit Home</GlassCard>
        <GlassCard className="you-link">Privacy</GlassCard>
      </div>

      {/* Privacy default */}
      <div className="section-row">
        <span className="section-label">Privacy default</span>
      </div>
      <div className="privacy-opts">
        {PRIVACY_OPTS.map((o) => (
          <div key={o.id} className={`priv-opt ${profile.privacyDefault === o.id ? 'active' : ''}`}>
            {o.label}
          </div>
        ))}
      </div>
      <p className="module-hint faint">
        Your public profile never shows weight, calories, food logs, raw 1–10s, tasks, or calendar
        unless you explicitly share a moment.
      </p>
    </div>
  );
}
