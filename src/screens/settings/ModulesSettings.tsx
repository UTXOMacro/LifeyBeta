import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { GlassCard } from '../../components/ui';
import { SettingsHeader } from './SettingsHeader';

// Settings → Modules. Toggling updates Home tiles + Pulse weights immediately.
// Off modules hide from Home and Pulse. "Show on profile" defaults off.
export function ModulesSettings() {
  const navigate = useNavigate();
  const modules = useStore((s) => s.modules);
  const toggleModule = useStore((s) => s.toggleModule);
  const toggleShowOnProfile = useStore((s) => s.toggleShowOnProfile);

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="Modules" onBack={() => navigate('/you')} />

      <p className="settings-helper faint">Off modules hide from Home and Pulse.</p>

      <div className="module-list">
        {modules.map((m) => (
          <GlassCard key={m.id} className="module-setting-row">
            <div className="msr-main">
              <div className="msr-title">{m.label}</div>
              <div className="msr-desc faint">{m.description}</div>
              {m.enabled && (
                <button
                  className={`msr-profile ${m.showOnProfile ? 'on' : ''}`}
                  onClick={() => toggleShowOnProfile(m.id)}
                >
                  <span className={`mini-switch ${m.showOnProfile ? 'on' : ''}`}>
                    <span className="mini-knob" />
                  </span>
                  Show on profile
                </button>
              )}
            </div>
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

      <p className="settings-helper faint">
        Care is optional. It reflects your preferences, not medical risk.
      </p>
    </div>
  );
}
