// ─────────────────────────────────────────────────────────────
// Lifey data model
// Implemented now even where UI is thin, so mock data swaps to APIs cleanly.
// ─────────────────────────────────────────────────────────────

export type ModuleId = 'sleep' | 'movement' | 'food' | 'mindset' | 'routines' | 'social';

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
