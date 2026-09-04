import { create } from 'zustand';
import type {
  Belief,
  ChatMessage,
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
  mockProfile,
  mockScores,
  mockTasks,
  mockThread,
  mockWeek,
} from './data/mock';

interface LifeyState {
  profile: Profile;
  modules: ModuleConfig[];
  layout: WidgetInstance[];
  scores: Score[];
  tasks: Task[];
  week: boolean[];
  thread: ChatMessage[];
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

  // chat (Connect write path)
  sendMessage: (text: string) => void;

  // derived
  pulse: () => number;
  pulseParts: () => PulsePart[];
  activeModules: () => ModuleConfig[];
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
  thread: mockThread,
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

  // Connect write path — every turn may persist a signal or preference,
  // then Pulse quietly refreshes (derived from scores/modules).
  sendMessage: (text) =>
    set((state) => {
      const userMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'user',
        text,
        ts: Date.now(),
      };
      const reply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'lifey',
        text: mockReply(text),
        ts: Date.now() + 1,
      };

      const write = parseWrite(text);
      const patch: Partial<LifeyState> = { thread: [...state.thread, userMsg, reply] };

      if (write?.kind === 'score') {
        patch.scores = [
          {
            module: write.module,
            date: new Date().toISOString().slice(0, 10),
            source: 'inferred',
            value1to10: write.value,
            note: text.slice(0, 80),
          },
          ...state.scores,
        ];
      } else if (write?.kind === 'preference' && write.key === 'trackFood' && write.value === false) {
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

      return patch;
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
}));

// Very small NL parser for the demo: lets Connect write a food 1–10 or
// "don't track food". Real version routes through an LLM tool call.
type Write =
  | { kind: 'score'; module: ModuleId; value: number }
  | { kind: 'preference'; key: string; value: boolean };

function parseWrite(text: string): Write | null {
  const t = text.toLowerCase();

  if (/(don'?t|stop|no).*(track|count).*(food|bite|calorie)/.test(t) || /trackfood\s*=\s*false/.test(t)) {
    return { kind: 'preference', key: 'trackFood', value: false };
  }

  // "food 7", "rate food 8/10", "food was a 6 today"
  const foodMatch = t.match(/food\D{0,12}(\d{1,2})/);
  if (foodMatch) {
    const v = Math.min(10, Math.max(1, Number(foodMatch[1])));
    return { kind: 'score', module: 'food', value: v };
  }
  const sleepMatch = t.match(/(slept|sleep)\D{0,12}(\d{1,2})/);
  if (sleepMatch) {
    const v = Math.min(10, Math.max(1, Number(sleepMatch[2])));
    return { kind: 'score', module: 'sleep', value: v };
  }
  return null;
}

function mockReply(text: string): string {
  const t = text.toLowerCase();
  if (/(don'?t|stop|no).*(track|count).*(food|bite|calorie)/.test(t)) {
    return "Done — I'll stop scoring food and drop it from your Pulse. We can bring it back anytime.";
  }
  if (/food\D{0,12}\d/.test(t)) {
    return "Got it — logged how food felt today. That's the pattern I care about, not any single meal.";
  }
  if (t.includes('walk') || t.includes('move')) {
    return "Love it. I'll put a 20-min walk on Today. Mornings work best for you — want it before work?";
  }
  if (t.includes('sleep') || t.includes('bed') || t.includes('tired')) {
    return 'Got it. Winding down by 10:30 is your good-enough. Want a gentle nudge at 10?';
  }
  if (t.includes('derail') || t.includes('scroll')) {
    return "Late-night scrolling is the usual one. No shame — want me to swap the phone for a book reminder?";
  }
  return "Noted. I'll keep that in mind and check back. Anything you want on Today for tomorrow?";
}
