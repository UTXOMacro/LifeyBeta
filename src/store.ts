import { create } from 'zustand';
import type {
  ChatMessage,
  LifeContext,
  ModuleConfig,
  ModuleId,
  Profile,
  Score,
  Task,
  TaskStatus,
  WidgetId,
  WidgetInstance,
  WidgetSize,
} from './types';
import { WIDGET_META } from './data/widgets';
import {
  defaultLayout,
  defaultModules,
  mockContext,
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

  // module toggles
  toggleModule: (id: ModuleId) => void;
  isModuleOn: (id: ModuleId) => boolean;

  // widget layout ops
  addWidget: (widget: WidgetId, size?: WidgetSize) => void;
  removeWidget: (key: string) => void;
  moveWidget: (from: number, to: number) => void;
  resizeWidget: (key: string, size: WidgetSize) => void;

  // tasks
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // capture: write a score (+ optional quantity/note)
  addScore: (s: Score) => void;

  // chat
  sendMessage: (text: string) => void;

  // derived
  pulse: () => number;
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

  toggleModule: (id) =>
    set((state) => {
      const modules = state.modules.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m,
      );
      return { modules, layout: pruneLayout(state.layout, modules) };
    }),

  isModuleOn: (id) => !!get().modules.find((m) => m.id === id)?.enabled,

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

  sendMessage: (text) =>
    set((state) => {
      const userMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'user',
        text,
        ts: Date.now(),
      };
      // Lightweight mock reply so the thread feels alive in the demo.
      const reply: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: 'lifey',
        text: mockReply(text),
        ts: Date.now() + 1,
      };
      return { thread: [...state.thread, userMsg, reply] };
    }),

  pulse: () => {
    const state = get();
    const on = new Set(state.modules.filter((m) => m.enabled).map((m) => m.id));
    const today = new Date().toISOString().slice(0, 10);
    // latest score per active module (prefer today, else most recent)
    const byModule = new Map<ModuleId, number>();
    for (const s of state.scores) {
      if (!on.has(s.module)) continue;
      if (!byModule.has(s.module)) byModule.set(s.module, s.value1to10);
      if (s.date === today) byModule.set(s.module, s.value1to10);
    }
    const vals = [...byModule.values()];
    if (vals.length === 0) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  },

  activeModules: () => get().modules.filter((m) => m.enabled),
}));

function mockReply(text: string): string {
  const t = text.toLowerCase();
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
