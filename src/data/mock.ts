import type {
  ChatMessage,
  FriendEdge,
  LifeContext,
  ModuleConfig,
  Post,
  Profile,
  Quantity,
  Score,
  Task,
  WidgetInstance,
} from '../types';

// Bundled portrait avatars (local, so the demo never depends on the network).
import ryanPhoto from '../assets/avatars/ryan.jpg';
import mayaPhoto from '../assets/avatars/maya.jpg';
import devinPhoto from '../assets/avatars/devin.jpg';
import priyaPhoto from '../assets/avatars/priya.jpg';
import f4Photo from '../assets/avatars/f4.jpg';
import f5Photo from '../assets/avatars/f5.jpg';
import f6Photo from '../assets/avatars/f6.jpg';
import f7Photo from '../assets/avatars/f7.jpg';

// ── Profile ──────────────────────────────────────────────
export const mockProfile: Profile = {
  firstName: 'Ryan',
  displayName: 'Ryan',
  photo: ryanPhoto,
  howImLiving: 'Trying to sleep more and move most days.',
  privacyDefault: 'friends',
};

// ── Modules (Sleep + Movement on by default per brief) ───
// Reference frame (Lifey-Home-01) shows four active modules in Pulse:
// Sleep, Move, Food, Mindset. Product rule intact: Pulse = active only.
export const defaultModules: ModuleConfig[] = [
  { id: 'sleep', label: 'Sleep', enabled: true },
  { id: 'movement', label: 'Move', enabled: true },
  { id: 'food', label: 'Food', enabled: true },
  { id: 'mindset', label: 'Mindset', enabled: true },
  { id: 'routines', label: 'Routines', enabled: false },
  { id: 'social', label: 'Social', enabled: false },
];

// ── Default Home layout (Sleep + Movement enabled) ───────
// Pulse (medium), Sleep (small), Movement (small), Tasks (small), Week (medium)
export const defaultLayout: WidgetInstance[] = [
  { key: 'w-pulse', widget: 'pulse', size: 'medium' },
  { key: 'w-sleep', widget: 'sleep', size: 'small' },
  { key: 'w-movement', widget: 'movement', size: 'small' },
  { key: 'w-tasks', widget: 'tasks', size: 'small' },
  { key: 'w-week', widget: 'week', size: 'medium' },
];

// ── Scores (used to compute Pulse + sparklines) ──────────
const today = new Date();
function dayOffset(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const mockScores: Score[] = [
  { module: 'sleep', date: dayOffset(0), source: 'device', value1to10: 8, note: '7h 12m' },
  { module: 'sleep', date: dayOffset(1), source: 'device', value1to10: 6 },
  { module: 'sleep', date: dayOffset(2), source: 'device', value1to10: 7 },
  { module: 'sleep', date: dayOffset(3), source: 'device', value1to10: 5 },
  { module: 'sleep', date: dayOffset(4), source: 'device', value1to10: 8 },
  { module: 'sleep', date: dayOffset(5), source: 'device', value1to10: 7 },
  { module: 'sleep', date: dayOffset(6), source: 'device', value1to10: 6 },
  { module: 'movement', date: dayOffset(0), source: 'device', value1to10: 7, note: '4.2 mi' },
  { module: 'movement', date: dayOffset(1), source: 'device', value1to10: 3 },
  { module: 'movement', date: dayOffset(2), source: 'device', value1to10: 6 },
  { module: 'movement', date: dayOffset(3), source: 'device', value1to10: 5 },
  { module: 'movement', date: dayOffset(4), source: 'device', value1to10: 8 },
  { module: 'movement', date: dayOffset(5), source: 'device', value1to10: 2 },
  { module: 'movement', date: dayOffset(6), source: 'device', value1to10: 6 },
  { module: 'food', date: dayOffset(0), source: 'manual', value1to10: 7, note: 'felt good' },
  { module: 'food', date: dayOffset(1), source: 'manual', value1to10: 6 },
  { module: 'food', date: dayOffset(2), source: 'manual', value1to10: 8 },
  { module: 'mindset', date: dayOffset(0), source: 'manual', value1to10: 8, note: 'clear head' },
  { module: 'mindset', date: dayOffset(1), source: 'manual', value1to10: 7 },
  { module: 'mindset', date: dayOffset(2), source: 'manual', value1to10: 8 },
];

export const mockQuantities: Quantity[] = [
  { type: 'sleep', value: 7.2, unit: 'h', date: dayOffset(0) },
  { type: 'steps', value: 8420, unit: 'steps', date: dayOffset(0) },
  { type: 'distance', value: 4.2, unit: 'mi', date: dayOffset(0) },
];

// ── Today tasks (max 3) ──────────────────────────────────
export const mockTasks: Task[] = [
  { id: 't1', title: 'Evening walk, 20 min', module: 'movement', status: 'done' },
  { id: 't2', title: 'Wind down by 10:30', module: 'sleep', status: 'open' },
  { id: 't3', title: 'Text a friend back', module: 'social', status: 'done' },
];

// ── Week strip: filled/empty per day (Mon..Sun) ──────────
export const mockWeek: boolean[] = [true, true, false, true, true, false, false];

// ── Friends ──────────────────────────────────────────────
export const mockFriends: FriendEdge[] = [
  { id: 'f1', name: 'Maya', avatar: mayaPhoto },
  { id: 'f2', name: 'Devin', avatar: devinPhoto },
  { id: 'f3', name: 'Priya', avatar: priyaPhoto },
  { id: 'f4', name: 'Sam', avatar: f4Photo },
  { id: 'f5', name: 'Ava', avatar: f5Photo },
  { id: 'f6', name: 'Noah', avatar: f6Photo },
  { id: 'f7', name: 'Ivy', avatar: f7Photo },
];

export const mockPosts: Post[] = [
  { id: 'p1', friendId: 'f1', visibility: 'friends', type: 'moment', text: 'went for a morning run', when: '1h' },
  { id: 'p2', friendId: 'f2', visibility: 'friends', type: 'milestone', text: 'hit 5 nights of good sleep', when: '3h' },
  { id: 'p3', friendId: 'f3', visibility: 'friends', type: 'checkin', text: 'cooked at home all week', when: '5h' },
];

// ── Connect context chip + thread ────────────────────────
export const mockContext: LifeContext = {
  goals: ['Sleep 7+ hrs', 'Move most days'],
  preferences: ['Prefers mornings'],
  scheduleHints: ['Bed ~10:30'],
  derailers: ['Late-night phone scrolling'],
  goodEnough: 'A walk and lights out by 11 counts as a win.',
};

export const mockThread: ChatMessage[] = [
  {
    id: 'm1',
    role: 'lifey',
    text: "Hey Ryan. Good week so far — sleep's been steady. Want to lock in tomorrow's walk?",
    ts: Date.now() - 1000 * 60 * 60 * 3,
  },
];
