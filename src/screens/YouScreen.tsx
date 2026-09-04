import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Avatar, ChevronRow, GlassCard, ModuleChip } from '../components/ui';
import type { Belief, PulsePart } from '../types';

// You — "Your Pulse model": identity + why Pulse is this number for this
// person + entry to settings. Not a second Home; switches/privacy live in
// pushed Settings screens.
export function YouScreen() {
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const modules = useStore((s) => s.modules);
  const beliefs = useStore((s) => s.beliefs);
  const friendsCount = useStore((s) => s.friendsCount);
  const pulse = useStore((s) => s.pulse)();
  const parts = useStore((s) => s.pulseParts)();

  const highlightChips = modules.filter((m) => m.enabled && m.showOnProfile);

  return (
    <div className="screen you-screen">
      <h1 className="screen-title serif">You</h1>

      {/* Identity */}
      <div className="you-identity">
        <Avatar label={profile.displayName[0]} src={profile.photo} size={116} />
        <div className="you-name-lg">{profile.displayName}</div>
        <div className="you-bio">{profile.howImLiving}</div>
        <div className="you-friends">
          <FriendsGlyph /> {friendsCount} friends
        </div>
      </div>

      {/* Highlight chips (not switches) */}
      {highlightChips.length > 0 && (
        <div className="you-chips">
          {highlightChips.map((m) => (
            <ModuleChip key={m.id}>{m.label}</ModuleChip>
          ))}
        </div>
      )}

      {/* Your Pulse model composition */}
      <PulseCompositionCard
        pulse={pulse}
        parts={parts}
        careOff={!isOn(modules, 'care')}
        onHistory={() => navigate('/pulse/history')}
      />

      {/* What Lifey knows */}
      <div className="section-row">
        <span className="section-label lg">What Lifey knows</span>
      </div>
      <div className="knows-grid">
        {beliefs.slice(0, 4).map((b) => (
          <LifeContextCard key={b.id} belief={b} />
        ))}
      </div>

      {/* Moments — empty state */}
      <div className="section-row">
        <span className="section-label lg">Moments</span>
      </div>
      <GlassCard className="moments-empty">Share a walk or a win</GlassCard>

      {/* Chevron settings rows */}
      <div className="settings-list">
        <ChevronRow icon={<GridIcon />} label="Modules" onClick={() => navigate('/settings/modules')} />
        <ChevronRow icon={<PlugIcon />} label="Integrations" onClick={() => navigate('/settings/integrations')} />
        <ChevronRow icon={<DocIcon />} label="Evidence & sources" onClick={() => navigate('/settings/evidence')} />
        <ChevronRow icon={<ShieldIcon />} label="Privacy" onClick={() => navigate('/settings/privacy')} />
        <ChevronRow icon={<EditIcon />} label="Edit Home" onClick={() => navigate('/')} />
        <ChevronRow icon={<BellIcon />} label="Notifications" />
      </div>
    </div>
  );
}

function isOn(modules: ReturnType<typeof useStore.getState>['modules'], id: string) {
  return !!modules.find((m) => m.id === id)?.enabled;
}

// ── Pulse composition card ──────────────────────────────
function PulseCompositionCard({
  pulse,
  parts,
  careOff,
  onHistory,
}: {
  pulse: number;
  parts: PulsePart[];
  careOff: boolean;
  onHistory: () => void;
}) {
  return (
    <GlassCard className="pulse-model">
      <div className="pulse-model-head">
        <span className="pulse-model-title">Your Pulse model</span>
        <button className="pulse-model-history" onClick={onHistory}>
          History
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="pulse-model-body">
        <div className="pulse-model-number">{pulse.toFixed(1)}</div>
        <div className="pulse-model-rows">
          {parts.map((p) => (
            <div key={p.module} className="pulse-model-row">
              <span className="pmr-name">{p.label}</span>
              <span className="pmr-value">{p.score ?? '—'}</span>
              <span className="pmr-weight">{Math.round(p.weight * 100)}%</span>
            </div>
          ))}
          {careOff && (
            <div className="pulse-model-row care-off">
              <span className="pmr-name">Care</span>
              <span className="pmr-off">off</span>
            </div>
          )}
        </div>
      </div>

      <p className="pulse-model-caption">
        Pulse estimates how supported today looks. Not a diagnosis.
      </p>
    </GlassCard>
  );
}

// ── What Lifey knows card ───────────────────────────────
function LifeContextCard({ belief }: { belief: Belief }) {
  const dismiss = useStore((s) => s.dismissBelief);
  return (
    <button className="knows-card glass" onClick={() => dismiss(belief.id)}>
      <span className="knows-text">{belief.text}</span>
      <span className="knows-icon">{beliefIcon(belief.icon)}</span>
    </button>
  );
}

function beliefIcon(kind?: Belief['icon']) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'moon':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5z" /></svg>;
    case 'leaf':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M5 19c9 0 14-5 14-14-9 0-14 5-14 14z" /><path d="M5 19c3-6 7-8 10-9" /></svg>;
    case 'clock':
      return <svg width="18" height="18" viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4l3 2" /></svg>;
    default:
      return <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><circle cx="12" cy="12" r="2.4" /></svg>;
  }
}

// ── Inline icons ────────────────────────────────────────
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function FriendsGlyph() {
  return <svg className="friends-glyph" width="16" height="16" viewBox="0 0 24 24" {...ic}><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.4a3 3 0 0 1 0 5.2M17.5 19a5.5 5.5 0 0 0-2-4.2" /></svg>;
}
function GridIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
}
function DocIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6" /></svg>;
}
function ShieldIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>;
}
function EditIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>;
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
}
function PlugIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M9 2v6M15 2v6" /><path d="M6 8h12v3a6 6 0 0 1-12 0z" /><path d="M12 17v5" /></svg>;
}
