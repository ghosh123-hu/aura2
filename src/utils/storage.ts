import { Task, Habit, AddictionTracker, AddictionLog, UserSettings, FocusSession, ActiveFocusSession, TimeEntry, ActiveTimeTracker, Goal, DailyJournal } from '../types';

const STORAGE_KEYS = {
  TASKS: 'aura_v2_tasks',
  HABITS: 'aura_v2_habits',
  ADDICTION_TRACKERS: 'aura_v2_addiction_trackers',
  ADDICTION_LOGS: 'aura_v2_addiction_logs',
  SETTINGS: 'aura_v2_settings',
  FOCUS_SESSIONS: 'aura_v2_focus_sessions',
  ACTIVE_FOCUS: 'aura_v2_active_focus',
  TIME_ENTRIES: 'aura_v2_time_entries',
  TIME_CATEGORIES: 'aura_v2_time_categories',
  ACTIVE_TIME: 'aura_v2_active_time',
  GOALS: 'aura_v2_goals',
  DAILY_JOURNALS: 'aura_v2_daily_journals',
};

// Legacy keys from phase 1 to clean up automatically
const LEGACY_KEYS = [
  'aura_tasks_v1',
  'aura_habits_v1',
  'aura_addiction_trackers_v1',
  'aura_addiction_logs_v1',
  'aura_settings_v1',
];

export const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  greetingTitle: 'Personal Workspace',
  dailyTaskGoal: 3,
  confettiEnabled: true,
  notificationsEnabled: true,
};

export function getCleanEmptyData() {
  return {
    tasks: [] as Task[],
    habits: [] as Habit[],
    addictionTrackers: [] as AddictionTracker[],
    addictionLogs: [] as AddictionLog[],
    focusSessions: [] as FocusSession[],
    activeFocus: null as ActiveFocusSession | null,
    timeEntries: [] as TimeEntry[],
    timeCategories: ['Study', 'Work', 'Exercise', 'Sleep', 'Social Media', 'Entertainment', 'Personal'],
    activeTimeTracker: null as ActiveTimeTracker | null,
    settings: { ...DEFAULT_SETTINGS },
    goals: [] as Goal[],
    dailyJournals: [] as DailyJournal[],
  };
}

export function loadStoredData() {
  try {
    // Purge legacy demo keys if present
    LEGACY_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // ignore
      }
    });

    const rawTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    const rawHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const rawTrackers = localStorage.getItem(STORAGE_KEYS.ADDICTION_TRACKERS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.ADDICTION_LOGS);
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const rawFocusSessions = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
    const rawActiveFocus = localStorage.getItem(STORAGE_KEYS.ACTIVE_FOCUS);
    const rawTimeEntries = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    const rawTimeCategories = localStorage.getItem(STORAGE_KEYS.TIME_CATEGORIES);
    const rawActiveTime = localStorage.getItem(STORAGE_KEYS.ACTIVE_TIME);
    const rawGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
    const rawJournals = localStorage.getItem(STORAGE_KEYS.DAILY_JOURNALS);

    // If nothing has been saved yet, start with a completely clean, empty personal workspace.
    // Never auto-populate sample or demo data!
    const tasks: Task[] = rawTasks ? JSON.parse(rawTasks) : [];
    const habits: Habit[] = rawHabits ? JSON.parse(rawHabits) : [];
    const addictionTrackers: AddictionTracker[] = rawTrackers ? JSON.parse(rawTrackers) : [];
    const addictionLogs: AddictionLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    const settings: UserSettings = rawSettings ? JSON.parse(rawSettings) : { ...DEFAULT_SETTINGS };
    const focusSessions: FocusSession[] = rawFocusSessions ? JSON.parse(rawFocusSessions) : [];
    const activeFocus: ActiveFocusSession | null = rawActiveFocus ? JSON.parse(rawActiveFocus) : null;
    const storedEntries: TimeEntry[] = rawTimeEntries ? JSON.parse(rawTimeEntries) : [];
    const goals: Goal[] = rawGoals ? JSON.parse(rawGoals) : [];
    const dailyJournals: DailyJournal[] = rawJournals ? JSON.parse(rawJournals) : [];
    const timeEntries = [...storedEntries];
    if (rawFocusSessions) {
      const oldSessions: FocusSession[] = JSON.parse(rawFocusSessions);
      oldSessions.forEach((session) => {
        if (!timeEntries.some((entry) => entry.focusSessionId === session.id)) {
          timeEntries.push({ id: `time-${session.id}`, category: 'Work', activity: session.taskTitle, startedAt: session.startedAt, endedAt: session.endedAt, durationMinutes: session.durationMinutes, taskId: session.taskId, focusSessionId: session.id });
        }
      });
      if (timeEntries.length !== storedEntries.length) localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(timeEntries));
    }
    const timeCategories: string[] = rawTimeCategories ? JSON.parse(rawTimeCategories) : ['Study', 'Work', 'Exercise', 'Sleep', 'Social Media', 'Entertainment', 'Personal'];
    const activeTimeTracker: ActiveTimeTracker | null = rawActiveTime ? JSON.parse(rawActiveTime) : null;

    return {
      tasks,
      habits,
      addictionTrackers,
      addictionLogs,
      focusSessions,
      activeFocus,
      timeEntries,
      timeCategories,
      activeTimeTracker,
      settings,
      goals,
      dailyJournals,
    };
  } catch (err) {
    console.error('Error loading stored personal data:', err);
    return getCleanEmptyData();
  }
}

export function saveTimeEntries(entries: TimeEntry[]): void {
  try { localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries)); } catch (e) { console.error('Failed to save time entries', e); }
}
export function saveTimeCategories(categories: string[]): void {
  try { localStorage.setItem(STORAGE_KEYS.TIME_CATEGORIES, JSON.stringify(categories)); } catch (e) { console.error('Failed to save time categories', e); }
}
export function saveActiveTime(tracker: ActiveTimeTracker | null): void {
  try {
    if (tracker) localStorage.setItem(STORAGE_KEYS.ACTIVE_TIME, JSON.stringify(tracker));
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_TIME);
  } catch (e) { console.error('Failed to save active time tracker', e); }
}

export function saveFocusSessions(sessions: FocusSession[]): void {
  try { localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions)); } catch (e) { console.error('Failed to save focus sessions', e); }
}

export function saveActiveFocus(session: ActiveFocusSession | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEYS.ACTIVE_FOCUS, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEYS.ACTIVE_FOCUS);
  } catch (e) { console.error('Failed to save active focus session', e); }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits', e);
  }
}

export function saveAddictionTrackers(trackers: AddictionTracker[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADDICTION_TRACKERS, JSON.stringify(trackers));
  } catch (e) {
    console.error('Failed to save addiction trackers', e);
  }
}

export function saveAddictionLogs(logs: AddictionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADDICTION_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save addiction logs', e);
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals', e);
  }
}

export function saveDailyJournals(journals: DailyJournal[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_JOURNALS, JSON.stringify(journals));
  } catch (e) {
    console.error('Failed to save daily journals', e);
  }
}

export function clearAllData() {
  const empty = getCleanEmptyData();
  saveTasks(empty.tasks);
  saveHabits(empty.habits);
  saveAddictionTrackers(empty.addictionTrackers);
  saveAddictionLogs(empty.addictionLogs);
  saveFocusSessions(empty.focusSessions);
  saveActiveFocus(null);
  saveTimeEntries(empty.timeEntries);
  saveTimeCategories(empty.timeCategories);
  saveActiveTime(null);
  saveSettings(empty.settings);
  saveGoals(empty.goals);
  saveDailyJournals(empty.dailyJournals);
  return empty;
}
