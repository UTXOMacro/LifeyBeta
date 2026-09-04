import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

// Empty-state starter prompts from the brief.
const STARTERS = [
  'How I want to live',
  'What this week looks like',
  'What usually derails me',
  'What good enough means',
];

export function ConnectScreen({ seed, onSeedConsumed }: { seed?: string; onSeedConsumed: () => void }) {
  const thread = useStore((s) => s.thread);
  const sendMessage = useStore((s) => s.sendMessage);

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // If Home/header passed a seed (Lifey Now text, widget tap), prefill it.
  useEffect(() => {
    if (seed) {
      setInput(seed);
      onSeedConsumed();
    }
  }, [seed, onSeedConsumed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [thread.length]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setInput('');
  };

  return (
    <div className="screen connect-screen">
      <div className="connect-head">
        <h1 className="screen-title" style={{ margin: 0 }}>
          Connect
        </h1>
      </div>

      {/* thin context chip strip, not a form */}
      <div className="chip-strip">
        <span className="ctx-chip on">Sleep on</span>
        <span className="ctx-chip on">Move on</span>
        <span className="ctx-chip">Bed ~10:30</span>
        <span className="ctx-chip">Prefers mornings</span>
      </div>

      <div className="thread" ref={scrollRef}>
        {thread.length === 0 && (
          <div className="empty-starters">
            <p className="faint">Start wherever feels right:</p>
            {STARTERS.map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {thread.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

      {thread.length > 0 && thread.length <= 1 && (
        <div className="starter-row">
          {STARTERS.map((s) => (
            <button key={s} className="starter small" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Message Lifey…"
        />
        <button className="send" onClick={() => send(input)} aria-label="Send">
          ↑
        </button>
      </div>
    </div>
  );
}
