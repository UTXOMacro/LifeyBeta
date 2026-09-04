import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { GlassCard } from '../../components/ui';
import { SettingsHeader } from './SettingsHeader';
import type { EvidenceCard, ModuleId } from '../../types';

// Settings → Evidence & sources. Plain-language cards grouped by module.
// No disease claims; reviews/guidelines language only.
export function EvidenceSettings() {
  const navigate = useNavigate();
  const evidence = useStore((s) => s.evidence);
  const modules = useStore((s) => s.modules);

  // Group by primary module, in module order.
  const order = modules.map((m) => m.id);
  const groups = new Map<ModuleId, EvidenceCard[]>();
  for (const c of evidence) {
    const key = c.modules[0];
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  const labelFor = (id: ModuleId) => modules.find((m) => m.id === id)?.label ?? id;

  return (
    <div className="screen settings-screen">
      <SettingsHeader title="Evidence & sources" onBack={() => navigate('/you')} />

      <p className="settings-helper faint">
        How Lifey turns research into your 1–10s and weights. Plain language, no diagnoses.
      </p>

      {order
        .filter((id) => groups.has(id))
        .map((id) => (
          <div key={id} className="evidence-group">
            <div className="section-row">
              <span className="section-label">{labelFor(id)}</span>
            </div>
            {groups.get(id)!.map((c) => (
              <GlassCard key={c.id} className="evidence-card">
                <div className="ev-claim">{c.claim}</div>
                <div className="ev-meta">
                  <span className={`ev-grade ${c.grade}`}>{c.grade}</span>
                  <span className="ev-source faint">
                    {c.source} · {c.year}
                  </span>
                </div>
                <div className="ev-uses">
                  <span className="ev-uses-label">How Lifey uses it</span>
                  {c.howLifeyUses}
                </div>
              </GlassCard>
            ))}
          </div>
        ))}
    </div>
  );
}
