import type {
  Belief,
  ChatMessage,
  EvidenceCard,
  FriendEdge,
  LifeContext,
  ModuleConfig,
  Post,
  Preference,
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

// ── Modules ──────────────────────────────────────────────
// Each carries a default Pulse weight (renormalized across enabled
// modules by the engine). Off modules have weight 0 in practice —
// they're excluded from Home tiles, chips, and Pulse composition.
// Care defaults OFF and reflects preferences, not medical risk.
export const defaultModules: ModuleConfig[] = [
  {
    id: 'sleep',
    label: 'Sleep',
    enabled: true,
    weight: 0.35,
    description: 'Quality + consistency vs your baseline',
    showOnProfile: true,
  },
  {
    id: 'movement',
    label: 'Move',
    enabled: true,
    weight: 0.25,
    description: 'Activity vs your plan',
    showOnProfile: true,
  },
  {
    id: 'food',
    label: 'Food',
    enabled: true,
    weight: 0.2,
    description: 'Eating pattern vs your goal, not one meal',
    showOnProfile: true,
  },
  {
    id: 'mindset',
    label: 'Mindset',
    enabled: true,
    weight: 0.1,
    description: 'Optional momentum',
    showOnProfile: true,
  },
  {
    id: 'routines',
    label: 'Tasks',
    enabled: true,
    weight: 0.1,
    description: 'Planned vs done given your time',
    showOnProfile: false,
  },
  {
    id: 'social',
    label: 'Social',
    enabled: false,
    weight: 0.1,
    description: 'Staying in touch with your people',
    showOnProfile: false,
  },
  {
    id: 'care',
    label: 'Care',
    enabled: false,
    weight: 0,
    description: 'Optional — reflects your preferences, not medical risk',
    showOnProfile: false,
  },
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
  { module: 'routines', date: dayOffset(0), source: 'manual', value1to10: 6, note: 'most of today' },
  { module: 'routines', date: dayOffset(1), source: 'manual', value1to10: 7 },
  { module: 'routines', date: dayOffset(2), source: 'manual', value1to10: 5 },
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

// ── What Lifey knows (pinned beliefs, editable/dismissable) ─
export const mockBeliefs: Belief[] = [
  { id: 'b1', text: 'Sleep before 11', icon: 'moon', pinned: true },
  { id: 'b2', text: "Don't count every bite", icon: 'leaf', pinned: true },
  { id: 'b3', text: 'Mornings work best', icon: 'spark', pinned: true },
  { id: 'b4', text: 'A walk still counts', icon: 'clock', pinned: true },
];

// ── Preferences written by Connect/Capture ────────────
export const mockPreferences: Preference[] = [
  { key: 'trackFood', value: true },
  { key: 'prefersMornings', value: true },
];

// ── Evidence & sources (plain-language, no disease claims) ─
export const mockEvidence: EvidenceCard[] = [
  {
    id: 'ev-sleep-consistency',
    claim: 'More regular sleep timing is linked to steadier next-day energy and appetite.',
    grade: 'moderate',
    modules: ['sleep'],
    source: 'Sleep health reviews',
    year: 2023,
    howLifeyUses:
      'If bedtime drifts more than ~90 minutes from your usual, we lower sleep consistency — we do not crash Pulse.',
    connectHint: 'What time do you usually wind down?',
  },
  {
    id: 'ev-move-regular',
    claim: 'Regular light activity is associated with steadier mood and energy across the day.',
    grade: 'strong',
    modules: ['movement'],
    source: 'Physical activity guidelines',
    year: 2020,
    howLifeyUses:
      'Meeting your own movement plan nudges Move up; a rest day you planned does not count against you.',
    connectHint: 'What does a realistic movement week look like for you?',
  },
  {
    id: 'ev-food-pattern',
    claim: 'Overall eating patterns matter more for how you feel than any single meal.',
    grade: 'moderate',
    modules: ['food'],
    source: 'Dietary pattern reviews',
    year: 2019,
    howLifeyUses:
      'Food reflects how the week supports your goal — not a calorie count, and never an “organic = 10” halo.',
    connectHint: 'What does eating well look like for you this week?',
  },
  {
    id: 'ev-tasks-context',
    claim: 'Matching plans to the time you actually have supports follow-through.',
    grade: 'emerging',
    modules: ['routines'],
    source: 'Behavior-change literature',
    year: 2021,
    howLifeyUses:
      'Tasks compares done vs planned for today. A busy or travel day from Connect removes any penalty.',
  },
];
