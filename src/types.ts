// ─────────────────────────────────────────────────────────────
// Lifey data model
// Implemented now even where UI is thin, so mock data swaps to APIs cleanly.
// ─────────────────────────────────────────────────────────────

export type ModuleId =
  | 'sleep'
  | 'movement'
  | 'food'
  | 'mindset'
  | 'routines'
  | 'social'
  | 'care';

export type Visibility = 'me' | 'friends' | 'everyone';

export type ScoreSource = 'manual' | 'device' | 'inferred';

export type WidgetId =
  | 'pulse'
  | 'sleep'
  | 'movement'
  | 'food'
  | 'tasks'
  | 'friends'
  | 'week'
  | 'next';

export type WidgetSize = 'small' | 'medium';

export type TaskStatus = 'open' | 'done' | 'skipped' | 'snoozed';

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  /** whether the user has opted into this module */
  enabled: boolean;
  /** default Pulse weight when enabled (renormalized across enabled modules) */
  weight: number;
  /** one-line description shown in Settings → Modules */
  description: string;
  /** surface as a (non-switch) highlight chip on the public You profile */
  showOnProfile: boolean;
}

// One weighted input in the Pulse composition (shown on the You card).
export interface PulsePart {
  module: ModuleId;
  label: string;
  /** latest 1–10 for this module (undefined when no signal) */
  score?: number;
  /** 0–1 confidence; shrinks when data is stale */
  confidence: number;
  /** renormalized weight across enabled modules, as a fraction 0–1 */
  weight: number;
}

export interface PulseSnapshot {
  date: string;
  value: number;
  parts: PulsePart[];
}

export interface WidgetInstance {
  /** unique instance id (allows duplicates later if needed) */
  key: string;
  widget: WidgetId;
  size: WidgetSize;
}

export interface Score {
  module: ModuleId;
  date: string; // ISO date (YYYY-MM-DD)
  source: ScoreSource;
  value1to10: number;
  note?: string;
}

export interface Quantity {
  type: string; // 'steps' | 'hours' | 'miles' | ...
  value: number;
  unit: string;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  due?: string;
  module?: ModuleId;
  status: TaskStatus;
}

export interface LifeyEvent {
  id: string;
  date: string;
  title: string;
  module?: ModuleId;
}

export interface FriendEdge {
  id: string;
  name: string;
  avatar?: string;
}

export interface Post {
  id: string;
  friendId: string;
  visibility: Visibility;
  type: 'moment' | 'milestone' | 'checkin';
  text: string;
  when: string; // relative label for mock, e.g. "2h"
}

export interface LifeContext {
  goals: string[];
  preferences: string[];
  scheduleHints: string[];
  derailers: string[];
  goodEnough: string;
}

// A pinned thing Lifey knows about you (shown in “What Lifey knows”).
export interface Belief {
  id: string;
  text: string;
  icon?: 'moon' | 'leaf' | 'spark' | 'clock';
  pinned: boolean;
}

// Preference written by Connect/Capture, e.g. trackFood=false.
export interface Preference {
  key: string;
  value: string | number | boolean;
}

// A single opted-in signal that feeds the model.
export interface Signal {
  id: string;
  module: ModuleId;
  date: string;
  score?: number; // 1–10
  quantity?: Quantity;
  note?: string;
  source: 'chat' | 'capture' | 'device';
}

export type EvidenceGrade = 'strong' | 'moderate' | 'emerging' | 'preference';

export interface EvidenceCard {
  id: string;
  claim: string; // one plain-language sentence
  grade: EvidenceGrade;
  modules: ModuleId[];
  source: string;
  year: number;
  howLifeyUses: string; // how it changes a 1–10 or a weight
  connectHint?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'lifey';
  text: string;
  ts: number;
}

export interface Profile {
  firstName: string;
  displayName: string;
  photo?: string;
  howImLiving: string;
  privacyDefault: Visibility;
}

// External data sources that feed signals into the Pulse model.
export type IntegrationId =
  | 'strava'
  | 'apple-health'
  | 'amazon'
  | 'fitbit'
  | 'oura'
  | 'google-fit'
  | 'myfitnesspal'
  | 'instacart';

export interface Integration {
  id: IntegrationId;
  name: string;
  /** what this source informs, in plain language */
  informs: string;
  /** which Pulse modules it can feed */
  modules: ModuleId[];
  connected: boolean;
  /** true once real OAuth/API is wired; false = coming soon */
  available: boolean;
}
