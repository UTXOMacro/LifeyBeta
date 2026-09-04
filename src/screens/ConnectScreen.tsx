import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import type { Conversation } from '../types';

// Empty-state starter prompts from the brief.
const STARTERS = [
  'How I want to live',
  'What Pulse is allowed to use',
  'What good enough means',
  'What I do not want judged',
];

export function ConnectScreen({ seed, onSeedConsumed }: { seed?: string; onSeedConsumed: () => void }) {
  const conversations = useStore((s) => s.conversations);
  const activeId = useStore((s) => s.activeConversationId);
  const sendMessage = useStore((s) => s.sendMessage);
  const newConversation = useStore((s) => s.newConversation);
  const selectConversation = useStore((s) => s.selectConversation);

  const active = conversations.find((c) => c.id === activeId);
  const messages = active?.messages ?? [];

  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // If Home/header passed a seed, prefill it into the composer.
  useEffect(() => {
    if (seed) {
      setInput(seed);
      onSeedConsumed();
    }
  }, [seed, onSeedConsumed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, activeId]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setInput('');
  };

  const startNew = () => {
    newConversation();
    setDrawerOpen(false);
    setInput('');
  };

  const pickConversation = (id: string) => {
    selectConversation(id);
    setDrawerOpen(false);
  };

  return (
    <div className="screen connect-screen">
      {/* Chat header: menu · title · new chat */}
      <header className="connect-bar">
        <button className="cbar-btn" onClick={() => setDrawerOpen(true)} aria-label="Conversations">
          <MenuIcon />
        </button>
        <button className="cbar-title" onClick={() => setMemoryOpen((v) => !v)}>
          <span className="cbar-title-text">{active?.title ?? 'Connect'}</span>
          <ChevronDown />
        </button>
        <button className="cbar-btn" onClick={startNew} aria-label="New chat">
          <NewChatIcon />
        </button>
      </header>

      {/* Memory panel — the broad, cross-chat context that feeds the profile */}
      {memoryOpen && <MemoryPanel onClose={() => setMemoryOpen(false)} />}

      {/* thin context chip strip */}
      <div className="chip-strip">
        <span className="ctx-chip on">Sleep on</span>
        <span className="ctx-chip on">Move on</span>
        <span className="ctx-chip on">Nutrition on</span>
        <span className="ctx-chip off">Care off</span>
        <span className="ctx-chip">Bed ~11</span>
      </div>

      <div className="thread" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-starters">
            <p className="faint">Start wherever feels right:</p>
            {STARTERS.map((s) => (
              <button key={s} className="starter" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
      </div>

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

      {/* Slide-in conversation drawer (ChatGPT-style) */}
      <ConversationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNew={startNew}
        onPick={pickConversation}
      />
    </div>
  );
}

// ── Conversation drawer ─────────────────────────────────
function ConversationDrawer({
  open,
  onClose,
  onNew,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onPick: (id: string) => void;
}) {
  const conversations = useStore((s) => s.conversations);
  const activeId = useStore((s) => s.activeConversationId);
  const renameConversation = useStore((s) => s.renameConversation);
  const deleteConversation = useStore((s) => s.deleteConversation);

  const [query, setQuery] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.messages.some((m) => m.text.toLowerCase().includes(q)),
        )
      : conversations;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, query]);

  const groups = useMemo(() => groupByRecency(filtered), [filtered]);

  const rename = (id: string, current: string) => {
    const next = window.prompt('Rename conversation', current);
    if (next != null) renameConversation(id, next);
    setMenuFor(null);
  };
  const remove = (id: string) => {
    deleteConversation(id);
    setMenuFor(null);
  };

  return (
    <div className={`drawer-root ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-search">
          <SearchIcon />
          <input
            placeholder="Search chats"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button className="drawer-new" onClick={onNew}>
          <NewChatIcon />
          <span>New chat</span>
        </button>

        <div className="drawer-list">
          {groups.map((g) => (
            <div key={g.label} className="drawer-group">
              <div className="drawer-group-label">{g.label}</div>
              {g.items.map((c) => (
                <div
                  key={c.id}
                  className={`drawer-item ${c.id === activeId ? 'active' : ''}`}
                >
                  <button className="drawer-item-main" onClick={() => onPick(c.id)}>
                    <span className="drawer-item-title">{c.title}</span>
                    <span className="drawer-item-preview">{previewOf(c)}</span>
                  </button>
                  <button
                    className="drawer-item-more"
                    onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                    aria-label="More"
                  >
                    ⋯
                  </button>
                  {menuFor === c.id && (
                    <div className="drawer-item-menu">
                      <button onClick={() => rename(c.id, c.title)}>Rename</button>
                      <button className="danger" onClick={() => remove(c.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="drawer-empty faint">No chats found</div>}
        </div>
      </aside>
    </div>
  );
}

// ── Memory panel ────────────────────────────────────────
function MemoryPanel({ onClose }: { onClose: () => void }) {
  const memory = useStore((s) => s.memorySummary)();
  return (
    <div className="memory-panel glass">
      <div className="memory-head">
        <span className="memory-title">What Lifey remembers</span>
        <button className="memory-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="memory-sub faint">
        Carried across every chat and used to shape your Pulse. Edit anytime on You.
      </p>
      <div className="memory-chips">
        {memory.map((m, i) => (
          <span key={i} className="memory-chip">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── helpers ─────────────────────────────────────────────
function previewOf(c: Conversation): string {
  const last = c.messages[c.messages.length - 1];
  if (!last) return 'New conversation';
  const who = last.role === 'user' ? 'You: ' : '';
  return who + last.text;
}

function groupByRecency(list: Conversation[]) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const buckets: Record<string, Conversation[]> = { Today: [], Yesterday: [], 'Previous 7 days': [], Earlier: [] };
  for (const c of list) {
    const age = now - c.updatedAt;
    if (age < DAY) buckets.Today.push(c);
    else if (age < 2 * DAY) buckets.Yesterday.push(c);
    else if (age < 7 * DAY) buckets['Previous 7 days'].push(c);
    else buckets.Earlier.push(c);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// ── icons ───────────────────────────────────────────────
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function MenuIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" {...ic}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}
function NewChatIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>;
}
function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...ic}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>;
}
function ChevronDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...ic}><path d="M6 9l6 6 6-6" /></svg>;
}
