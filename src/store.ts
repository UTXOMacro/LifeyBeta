import { create } from 'zustand';
import type {
  Belief,
  ChatMessage,
  Conversation,
  EvidenceCard,
  Integration,
  IntegrationId,
  LifeContext,
  ModuleConfig,
  ModuleId,
  Preference,
  Profile,
  PulsePart,
  Score,
  ScoreSource,
  Task,
  TaskStatus,
  WidgetId,
  WidgetInstance,
  WidgetSize,
} from './types';
import { WIDGET_META } from './data/widgets';
import { computePulse, pulseParts } from './lib/pulse';
import {
  defaultLayout,
  defaultModules,
  mockBeliefs,
  mockContext,
  mockEvidence,
  mockIntegrations,
  mockPreferences,
  mockConversations,
  mockProfile,
  mockScores,
  mockTasks,
  mockWeek,
} from './data/mock';

interface LifeyState {
  profile: Profile;
  modules: ModuleConfig[];
  layout: WidgetInstance[];
  scores: Score[];
  tasks: Task[];
  week: boolean[];
  // Connect: multiple conversations. All feed the same profile memory below.
  conversations: Conversation[];
  activeConversationId: string;
  context: LifeContext;
  beliefs: Belief[];
  preferences: Preference[];
  evidence: EvidenceCard[];
  integrations: Integration[];
  friendsCount: number;

  // module toggles
  toggleModule: (id: ModuleId) => void;
  isModuleOn: (id: ModuleId) => boolean;
  toggleShowOnProfile: (id: ModuleId) => void;

  // widget layout ops
  addWidget: (widget: WidgetId, size?: WidgetSize) => void;
  removeWidget: (key: string) => void;
  moveWidget: (from: number, to: number) => void;
  resizeWidget: (key: string, size: WidgetSize) => void;

  // tasks
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // capture / connect writes
  addScore: (s: Score) => void;
  setPreference: (key: string, value: string | number | boolean) => void;
  dismissBelief: (id: string) => void;

  // privacy
  setPrivacyDefault: (v: Profile['privacyDefault']) => void;

  // integrations
  toggleIntegration: (id: IntegrationId) => void;

  // chat (Connect write path) — targets the active conversation, and every
  // turn may also persist shared long-term profile memory.
  sendMessage: (text: string) => void;

  // conversations (ChatGPT-style multi-chat)
  newConversation: () => string;
  selectConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;

  // derived
  pulse: () => number;
  pulseParts: () => PulsePart[];
  activeModules: () => ModuleConfig[];
  activeConversation: () => Conversation | undefined;
  /** compact summary of what Lifey remembers across ALL chats */
  memorySummary: () => string[];
}

// Strip widgets whose module is off, and drop empty slots.
function pruneLayout(layout: WidgetInstance[], modules: ModuleConfig[]): WidgetInstance[] {
  const on = new Set(modules.filter((m) => m.enabled).map((m) => m.id));
  return layout.filter((w) => {
    const meta = WIDGET_META[w.widget];
    if (!meta.module) return true; // always-available widget
    return on.has(meta.module);
  });
}

export const useStore = create<LifeyState>((set, get) => ({
  profile: mockProfile,
  modules: defaultModules,
  layout: defaultLayout,
  scores: mockScores,
  tasks: mockTasks,
  week: mockWeek,
  conversations: mockConversations,
  activeConversationId: mockConversations[0]?.id ?? '',
  context: mockContext,
  beliefs: mockBeliefs,
  preferences: mockPreferences,
  evidence: mockEvidence,
  integrations: mockIntegrations,
  friendsCount: 12,

  toggleModule: (id) =>
    set((state) => {
      const modules = state.modules.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m,
      );
      // Off modules also drop off the public profile chips.
      const cleaned = modules.map((m) => (m.enabled ? m : { ...m, showOnProfile: false }));
      return { modules: cleaned, layout: pruneLayout(state.layout, cleaned) };
    }),

  isModuleOn: (id) => !!get().modules.find((m) => m.id === id)?.enabled,

  toggleShowOnProfile: (id) =>
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id && m.enabled ? { ...m, showOnProfile: !m.showOnProfile } : m,
      ),
    })),

  addWidget: (widget, size = 'small') =>
    set((state) => {
      if (state.layout.some((w) => w.widget === widget)) return state; // no dupes for MVP
      const key = `w-${widget}-${Date.now()}`;
      return { layout: [...state.layout, { key, widget, size }] };
    }),

  removeWidget: (key) =>
    set((state) => ({ layout: state.layout.filter((w) => w.key !== key) })),

  moveWidget: (from, to) =>
    set((state) => {
      const layout = [...state.layout];
      const [item] = layout.splice(from, 1);
      layout.splice(to, 0, item);
      return { layout };
    }),

  resizeWidget: (key, size) =>
    set((state) => ({
      layout: state.layout.map((w) => (w.key === key ? { ...w, size } : w)),
    })),

  setTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),

  addScore: (s) => set((state) => ({ scores: [s, ...state.scores] })),

  setPreference: (key, value) =>
    set((state) => {
      const preferences = state.preferences.some((p) => p.key === key)
        ? state.preferences.map((p) => (p.key === key ? { key, value } : p))
        : [...state.preferences, { key, value }];
      // "don't track food" flips the Food module off immediately.
      if (key === 'trackFood' && value === false) {
        const modules = state.modules.map((m) =>
          m.id === 'food' ? { ...m, enabled: false, showOnProfile: false } : m,
        );
        return { preferences, modules, layout: pruneLayout(state.layout, modules) };
      }
      return { preferences };
    }),

  dismissBelief: (id) =>
    set((state) => ({ beliefs: state.beliefs.filter((b) => b.id !== id) })),

  setPrivacyDefault: (v) =>
    set((state) => ({ profile: { ...state.profile, privacyDefault: v } })),

  toggleIntegration: (id) =>
    set((state) => ({
      integrations: state.integrations.map((i) =>
        i.id === id && i.available ? { ...i, connected: !i.connected } : i,
      ),
    })),

  // Connect write path — appends to the ACTIVE conversation, and every turn
  // may also persist shared long-term profile memory (scores, preferences,
  // pinned beliefs). Pulse quietly refreshes (derived from scores/modules).
  sendMessage: (text) =>
    set((state) => {
      const now = Date.now();
      const userMsg: ChatMessage = { id: `m-${now}`, role: 'user', text, ts: now };
      const reply: ChatMessage = {
        id: `m-${now + 1}`,
        role: 'lifey',
        text: mockReply(text),
        ts: now + 1,
      };

      // Update the active conversation: append both messages, auto-title from
      // the first user message, drop draft flag, bump updatedAt.
      const conversations = state.conversations.map((c) => {
        if (c.id !== state.activeConversationId) return c;
        const firstUser = !c.messages.some((m) => m.role === 'user');
        return {
          ...c,
          title: firstUser && (c.isDraft || c.title === 'New chat') ? titleFrom(text) : c.title,
          isDraft: false,
          messages: [...c.messages, userMsg, reply],
          updatedAt: now + 1,
        };
      });
      const patch: Partial<LifeyState> = { conversations };

      // Shared profile memory writes (visible from every chat + on You).
      // A single message can produce multiple scored signals (e.g. sleep +
      // nutrition), each carrying its input source for Pulse History.
      const writes = parseWrites(text, 'chat');
      const today = new Date().toISOString().slice(0, 10);
      const newScores: Score[] = [];
      for (const w of writes) {
        if (w.kind === 'score') {
          newScores.push({
            module: w.module,
            date: today,
            source: w.source,
            value1to10: w.value,
            note: w.note,
          });
        } else if (w.kind === 'preference' && w.key === 'trackFood' && w.value === false) {
          const modules = state.modules.map((m) =>
            m.id === 'food' ? { ...m, enabled: false, showOnProfile: false } : m,
          );
          patch.modules = modules;
          patch.layout = pruneLayout(state.layout, modules);
          patch.preferences = [
            ...state.preferences.filter((p) => p.key !== 'trackFood'),
            { key: 'trackFood', value: false },
          ];
        }
      }
      if (newScores.length > 0) {
        patch.scores = [...newScores, ...state.scores];
      }

      // Pin durable statements as long-term beliefs (broad memory window).
      const belief = extractBelief(text);
      if (belief && !state.beliefs.some((b) => b.text.toLowerCase() === belief.toLowerCase())) {
        patch.beliefs = [...state.beliefs, { id: `b-${now}`, text: belief, icon: 'spark', pinned: true }];
      }

      return patch;
    }),

  newConversation: () => {
    const id = `c-${Date.now()}`;
    set((state) => ({
      conversations: [
        { id, title: 'New chat', messages: [], createdAt: Date.now(), updatedAt: Date.now(), isDraft: true },
        ...state.conversations,
      ],
      activeConversationId: id,
    }));
    return id;
  },

  selectConversation: (id) => set({ activeConversationId: id }),

  renameConversation: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, title: title.trim() || c.title } : c,
      ),
    })),

  deleteConversation: (id) =>
    set((state) => {
      const remaining = state.conversations.filter((c) => c.id !== id);
      const active =
        state.activeConversationId === id
          ? remaining[0]?.id ?? ''
          : state.activeConversationId;
      return { conversations: remaining, activeConversationId: active };
    }),

  pulse: () => {
    const state = get();
    return computePulse(pulseParts(state.modules, state.scores));
  },

  pulseParts: () => {
    const state = get();
    return pulseParts(state.modules, state.scores);
  },

  activeModules: () => get().modules.filter((m) => m.enabled),

  activeConversation: () => {
    const state = get();
    return state.conversations.find((c) => c.id === state.activeConversationId);
  },

  // Broad, cross-chat memory that feeds the user's profile. Pulled from
  // beliefs + preferences + context so it's the same in every conversation.
  memorySummary: () => {
    const state = get();
    const out: string[] = [];
    for (const b of state.beliefs) out.push(b.text);
    for (const g of state.context.goals) out.push(g);
    if (state.context.goodEnough) out.push(state.context.goodEnough);
    for (const d of state.context.derailers) out.push(`Watch: ${d}`);
    const trackFood = state.preferences.find((p) => p.key === 'trackFood');
    if (trackFood && trackFood.value === false) out.push("Doesn't want food counted");
    // de-dupe, cap for a tidy panel
    return [...new Set(out)].slice(0, 8);
  },
}));

// Auto-title a new chat from its first message (ChatGPT-style).
function titleFrom(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= 34) return clean;
  return clean.slice(0, 32).trimEnd() + '…';
}

// Pull a durable, first-person statement worth remembering long-term.
function extractBelief(text: string): string | null {
  const t = text.trim();
  const lower = t.toLowerCase();
  // Durable intent/preference phrasing → worth pinning.
  if (/^(i want|i'd like|i prefer|i don'?t want|remember that|my goal|i'm trying)/.test(lower)) {
    return titleFrom(t);
  }
  return null;
}

// NL parser for the demo: turns natural statements from Connect into scored
// signals that move Pulse up or down. Real version routes through an LLM tool
// call; this is deterministic + explainable for the demo.
type ScoreWrite = {
  kind: 'score';
  module: ModuleId;
  value: number;
  source: ScoreSource;
  note: string;
};
type PrefWrite = { kind: 'preference'; key: string; value: boolean };
type Write = ScoreWrite | PrefWrite;

const clamp = (n: number) => Math.min(10, Math.max(1, Math.round(n)));

// Map sleep hours → a 1–10 that peaks around 7.5–8h.
function sleepHoursToScore(h: number): number {
  if (h >= 7 && h <= 9) return 9;
  if (h >= 6.5) return 8;
  if (h >= 6) return 6;
  if (h >= 5) return 5;
  if (h >= 4) return 3;
  return 2;
}

// Map activity minutes → a 1–10 (more sustained movement scores higher).
function activityMinsToScore(mins: number): number {
  if (mins >= 60) return 9;
  if (mins >= 40) return 8;
  if (mins >= 25) return 7;
  if (mins >= 15) return 6;
  if (mins >= 5) return 5;
  return 4;
}

const GOOD_FOOD = /(chicken|rice|salad|veg|veggie|vegetable|greens|home ?cooked|cooked at home|grilled|fish|salmon|fruit|oats|beans|lentil|soup|balanced)/;
const BAD_FOOD = /(burger|fries|fast food|takeout|take-out|pizza|soda|candy|donut|fried|chips|junk|drive.?thru)/;

export function parseWrites(text: string, source: ScoreSource = 'chat'): Write[] {
  const t = text.toLowerCase();
  const writes: Write[] = [];

  // Preference: stop tracking nutrition/food.
  if (/(don'?t|stop|no).*(track|count).*(food|nutrition|bite|calorie)/.test(t) || /trackfood\s*=\s*false/.test(t)) {
    writes.push({ kind: 'preference', key: 'trackFood', value: false });
    return writes;
  }

  // ── Sleep ────────────────────────────────────────────
  // "slept 4 hours", "only got 5 hrs of sleep", "sleep 8"
  const sleepHrs = t.match(/(?:slept|sleep|got)\D{0,10}(\d{1,2}(?:\.\d)?)\s*(?:h|hr|hrs|hour)/) ||
    t.match(/(\d{1,2}(?:\.\d)?)\s*(?:h|hr|hrs|hours?)\D{0,10}(?:sleep|slept|in bed)/);
  if (sleepHrs) {
    const h = Number(sleepHrs[1]);
    writes.push({ kind: 'score', module: 'sleep', value: clamp(sleepHoursToScore(h)), source, note: `${h}h sleep` });
  } else {
    const sleepRate = t.match(/sleep\D{0,8}(\d{1,2})\s*(?:\/\s*10)?/);
    if (sleepRate && !/hour|hr|h\b/.test(t)) {
      writes.push({ kind: 'score', module: 'sleep', value: clamp(Number(sleepRate[1])), source, note: 'sleep check-in' });
    }
  }

  // ── Movement ────────────────────────────────────────
  // "1 hour bike ride", "30 min walk", "ran 45 minutes"
  const actHr = t.match(/(\d{1,2}(?:\.\d)?)\s*(?:hour|hr|hrs|h)\b.*?(bike|ride|run|walk|jog|swim|workout|gym|hike|cycl)/) ||
    t.match(/(bike|ride|run|walk|jog|swim|workout|gym|hike|cycl).*?(\d{1,2}(?:\.\d)?)\s*(?:hour|hr|hrs|h)\b/);
  const actMin = t.match(/(\d{1,3})\s*(?:min|mins|minute)\b.*?(bike|ride|run|walk|jog|swim|workout|gym|hike|cycl)/) ||
    t.match(/(bike|ride|run|walk|jog|swim|workout|gym|hike|cycl).*?(\d{1,3})\s*(?:min|mins|minute)\b/);
  if (actHr) {
    const hrNum = Number(actHr[1].match(/\d/) ? actHr[1] : actHr[2]);
    const mins = (isNaN(hrNum) ? Number(actHr[2]) : hrNum) * 60;
    writes.push({ kind: 'score', module: 'movement', value: clamp(activityMinsToScore(mins)), source, note: `${mins / 60}h activity` });
  } else if (actMin) {
    const mNum = Number(actMin[1].match(/\d/) ? actMin[1] : actMin[2]);
    const mins = isNaN(mNum) ? Number(actMin[2]) : mNum;
    writes.push({ kind: 'score', module: 'movement', value: clamp(activityMinsToScore(mins)), source, note: `${mins}min activity` });
  } else if (/(went for a|took a).*(walk|run|ride|jog|hike)/.test(t) || /\b(walked|ran|biked|cycled|jogged|hiked|swam|worked out)\b/.test(t)) {
    writes.push({ kind: 'score', module: 'movement', value: 7, source, note: 'moved today' });
  }

  // ── Nutrition (choices, not calories) ──────────────────────────
  const foodRate = t.match(/(?:food|nutrition|ate|eating)\D{0,12}(\d{1,2})\s*(?:\/\s*10)?/);
  const chose = /chose|picked|went with|instead of|over (?:the )?/.test(t);
  if (foodRate) {
    writes.push({ kind: 'score', module: 'food', value: clamp(Number(foodRate[1])), source, note: 'nutrition check-in' });
  } else if (chose && GOOD_FOOD.test(t)) {
    writes.push({ kind: 'score', module: 'food', value: 8, source, note: 'chose a supportive meal' });
  } else if (GOOD_FOOD.test(t) && !BAD_FOOD.test(t)) {
    writes.push({ kind: 'score', module: 'food', value: 8, source, note: 'supportive food' });
  } else if (BAD_FOOD.test(t) && !GOOD_FOOD.test(t)) {
    writes.push({ kind: 'score', module: 'food', value: 4, source, note: 'off-plan meal' });
  }

  return writes;
}

function mockReply(text: string): string {
  const t = text.toLowerCase();
  const writes = parseWrites(text, 'chat');
  const modsHit = new Set(writes.filter((w) => w.kind === 'score').map((w) => (w as ScoreWrite).module));

  if (writes.some((w) => w.kind === 'preference')) {
    return "Done — I'll stop scoring nutrition and drop it from your Pulse. We can bring it back anytime.";
  }
  // Acknowledge exactly what moved, and which way — no shame either way.
  const parts: string[] = [];
  for (const w of writes) {
    if (w.kind !== 'score') continue;
    if (w.module === 'sleep')
      parts.push(
        w.value <= 4
          ? 'logged the short night — that nudges Sleep down, no guilt'
          : w.value <= 6
            ? "logged the night — a bit under your usual, so Sleep dips slightly"
            : 'logged solid sleep — that lifts your Sleep',
      );
    if (w.module === 'movement') parts.push('counted that movement — Move goes up');
    if (w.module === 'food') parts.push(w.value >= 7 ? 'nice — that supportive choice lifts Nutrition' : 'logged it as an off-plan meal — Nutrition dips a little, tomorrow resets');
  }
  if (parts.length) {
    return `Got it — ${parts.join(', ')}. Your Pulse updated on Home and You.`;
  }
  if (modsHit.size === 0 && (t.includes('walk') || t.includes('move'))) {
    return "Love it. I'll put a 20-min walk on Today. Mornings work best for you — want it before work?";
  }
  if (t.includes('bed') || t.includes('tired')) {
    return 'Got it. Winding down by 10:30 is your good-enough. Want a gentle nudge at 10?';
  }
  if (t.includes('derail') || t.includes('scroll')) {
    return "Late-night scrolling is the usual one. No shame — want me to swap the phone for a book reminder?";
  }
  return "Noted. I'll keep that in mind and check back. Anything you want on Today for tomorrow?";
}
