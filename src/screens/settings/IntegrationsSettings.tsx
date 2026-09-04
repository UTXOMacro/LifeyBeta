import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { GlassCard } from '../../components/ui';
import { SettingsHeader } from './SettingsHeader';
import type { Integration } from '../../types';

// Settings → Integrations. Connect external sources that feed the Pulse
// model (movement, food/intake, hygiene/care). Mock connect for the demo;
// real version wires OAuth/API per provider.
export function IntegrationsSettings() {
  const navigate = useNavigate();
  const integrations = useStore((s) => s.integrations);
  const toggle = useStore((s) => s.toggleIntegration);

  const available = integrations.filter((i) => i.available);
  const comingSoon = integrations.filter((i) => !i.available);

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="Integrations" onBack={() => navigate('/you')} />

      <p className="settings-helper faint">
        Connect the apps you already use so Lifey can inform Pulse from real signals —
        movement, food and intake, sleep, and care. You choose what feeds in.
      </p>

      <div className="integration-list">
        {available.map((i) => (
          <IntegrationRow key={i.id} integration={i} onToggle={() => toggle(i.id)} />
        ))}
      </div>

      {comingSoon.length > 0 && (
        <>
          <div className="section-row">
            <span className="section-label">Coming soon</span>
          </div>
          <div className="integration-list">
            {comingSoon.map((i) => (
              <IntegrationRow key={i.id} integration={i} soon />
            ))}
          </div>
        </>
      )}

      <p className="settings-helper faint">
        Integrations only inform your own 1–10s and weights. Nothing is shared publicly,
        and you can disconnect any source anytime.
      </p>
    </div>
  );
}

function IntegrationRow({
  integration,
  onToggle,
  soon = false,
}: {
  integration: Integration;
  onToggle?: () => void;
  soon?: boolean;
}) {
  const { name, informs, connected } = integration;
  return (
    <GlassCard className={`integration-row ${soon ? 'is-soon' : ''}`}>
      <span className="int-logo">{Logo(integration.id)}</span>
      <div className="int-main">
        <div className="int-name">{name}</div>
        <div className="int-informs faint">{informs}</div>
      </div>
      {soon ? (
        <span className="int-soon">Soon</span>
      ) : (
        <button
          className={`int-connect ${connected ? 'connected' : ''}`}
          onClick={onToggle}
        >
          {connected ? 'Connected' : 'Connect'}
        </button>
      )}
    </GlassCard>
  );
}

// Simple monochrome brand marks (initial glyphs) — kept generic + on-brand.
function Logo(id: Integration['id']) {
  const letter: Record<string, string> = {
    strava: 'S',
    'apple-health': '♥',
    amazon: 'a',
    fitbit: 'F',
    oura: 'O',
    myfitnesspal: 'M',
    instacart: 'I',
    'google-fit': 'G',
  };
  return <span className="int-logo-glyph">{letter[id] ?? '?'}</span>;
}
