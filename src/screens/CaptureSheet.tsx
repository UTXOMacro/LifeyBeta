import { useState } from 'react';
import { useStore } from '../store';
import { scoreColor } from '../lib/score';
import type { ModuleId } from '../types';

// Center-tab quick sheet: photo, "I went," 1–10 score (feeling), short note.
// Writes a score into memory and refreshes widgets. Does not open Connect.
export function CaptureSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const modules = useStore((s) => s.modules);
  const addScore = useStore((s) => s.addScore);
  const activeModules = modules.filter((m) => m.enabled);

  const [module, setModule] = useState<ModuleId>(activeModules[0]?.id ?? 'sleep');
  const [score, setScore] = useState(7);
  const [note, setNote] = useState('');
  const [went, setWent] = useState(false);

  if (!open) return null;

  // Module-appropriate quick action + feeling prompt.
  const actionLabel: Record<string, string> = {
    sleep: '😴 Logged sleep',
    movement: '✓ I went',
    food: '🍽 I ate',
    mindset: '🧘 Checked in',
    routines: '✓ Did it',
    social: '💬 Connected',
  };
  const feelingPrompt = module === 'sleep' ? 'How rested?' : 'How did it feel?';

  const save = () => {
    addScore({
      module,
      date: new Date().toISOString().slice(0, 10),
      source: 'manual',
      value1to10: score,
      note: note || (went ? 'I went' : undefined),
    });
    // reset + close; widgets read from store so they refresh automatically
    setNote('');
    setWent(false);
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <h2 className="sheet-title">Quick capture</h2>

        <div className="capture-modules">
          {activeModules.map((m) => (
            <button
              key={m.id}
              className={`cap-mod ${module === m.id ? 'active' : ''}`}
              onClick={() => setModule(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="capture-actions">
          <button className={`cap-chip ${went ? 'on' : ''}`} onClick={() => setWent((v) => !v)}>
            {actionLabel[module] ?? '✓ Done'}
          </button>
          <button className="cap-chip">📷 Photo</button>
        </div>

        <div className="capture-score">
          <div className="cap-score-head">
            <span className="faint">{feelingPrompt}</span>
            <span className="cap-score-val" style={{ color: scoreColor(score) }}>
              {score}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ accentColor: scoreColor(score) }}
          />
          <div className="cap-scale faint">
            <span>rough</span>
            <span>neutral</span>
            <span>strong</span>
          </div>
        </div>

        <input
          className="capture-note"
          placeholder="Short note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="sheet-buttons">
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
