import type { ModuleId, WidgetId } from '../types';

export interface WidgetMeta {
  id: WidgetId;
  label: string;
  /** module this widget belongs to; undefined = always available */
  module?: ModuleId;
  supportsMedium: boolean;
  description: string;
}

// Registry describing every shippable widget.
export const WIDGET_META: Record<WidgetId, WidgetMeta> = {
  pulse: {
    id: 'pulse',
    label: 'Pulse',
    supportsMedium: true,
    description: 'Average of your active modules',
  },
  sleep: {
    id: 'sleep',
    label: 'Sleep',
    module: 'sleep',
    supportsMedium: true,
    description: 'Last night + 7-night trend',
  },
  movement: {
    id: 'movement',
    label: 'Movement',
    module: 'movement',
    supportsMedium: true,
    description: 'Distance + week trend',
  },
  food: {
    id: 'food',
    label: 'Nutrition',
    module: 'food',
    supportsMedium: true,
    description: 'How food felt this week',
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks',
    supportsMedium: true,
    description: 'What is left today',
  },
  friends: {
    id: 'friends',
    label: 'Friends',
    module: 'social',
    supportsMedium: true,
    description: 'Latest from your circle',
  },
  week: {
    id: 'week',
    label: 'This week',
    supportsMedium: true,
    description: 'Your week at a glance',
  },
  next: {
    id: 'next',
    label: 'Next',
    supportsMedium: true,
    description: 'Your next action',
  },
};
