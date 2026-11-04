export type Priority = 'low' | 'medium' | 'high';

export type TaskCategory =
  | 'Work'
  | 'Study'
  | 'Health'
  | 'Personal'
  | 'Finance'
  | 'Creative';

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (e.g., '14:00')
  deadline?: string; // HH:mm or YYYY-MM-DD HH:mm
  priority: Priority;
  category: TaskCategory | string;
  estimatedDuration: number; // in minutes
  timeSpentMinutes?: number;
  completed: boolean;
  completedAt?: string; // ISO string
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: 'Health' | 'Mindfulness' | 'Learning' | 'Productivity' | 'Fitness' | string;
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  targetCount: number; // e.g. 1 (complete once) or 8 (8 glasses)
  unit?: string; // e.g., 'times', 'pages', 'minutes', 'glasses'
  color: 'sage' | 'blue' | 'lavender' | 'yellow' | 'rose';
  icon: string;
  createdAt: string;
  completions: Record<string, number>; // date 'YYYY-MM-DD' -> count achieved
}

export type AddictionTrigger =
  | 'boredom'
  | 'stress'
  | 'loneliness'
  | 'procrastination'
  | 'fatigue'
  | 'habit'
  | 'other';

export interface AddictionLog {
  id: string;
  trackerId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  durationMinutes: number;
  trigger: AddictionTrigger;
  note?: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  completed: boolean;
}

export interface ActiveFocusSession {
  taskId?: string;
  taskTitle: string;
  durationMinutes: number;
  remainingSeconds: number;
  status: 'running' | 'paused';
  updatedAt: string;
}

export type TimeCategory = 'Study' | 'Work' | 'Exercise' | 'Sleep' | 'Social Media' | 'Entertainment' | 'Personal' | string;

export interface TimeEntry {
  id: string;
  category: TimeCategory;
  activity: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  taskId?: string;
  focusSessionId?: string;
}

export interface ActiveTimeTracker {
  category: TimeCategory;
  activity: string;
  startedAt: string;
  taskId?: string;
}

export interface AddictionTracker {
  id: string;
  name: string;
  description?: string;
  dailyLimitMinutes: number; // e.g., 30 min max, or 0 for complete cessation
  reductionGoal: string; // e.g., "< 30 mins/day" or "Zero late night"
  color: 'rose' | 'yellow' | 'lavender' | 'blue' | 'sage';
  icon: string;
  createdAt: string;
}

export interface ProductivityInsight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'milestone';
  title: string;
  description: string;
  metric?: string;
  category: 'tasks' | 'habits' | 'addiction' | 'overall';
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate?: string;
  progress: number; // 0 to 100
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
}

export interface DailyJournal {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  mood?: 'calm' | 'energized' | 'focused' | 'reflective' | 'stressed';
  gratitude?: string;
  createdAt: string;
}

export interface AuraUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserSettings {
  name: string;
  greetingTitle?: string;
  dailyTaskGoal: number;
  confettiEnabled: boolean;
  notificationsEnabled: boolean;
}

export type PageView =
  | 'dashboard'
  | 'tasks'
  | 'focus'
  | 'time-audit'
  | 'calendar'
  | 'habits'
  | 'addiction'
  | 'analytics'
  | 'settings';

