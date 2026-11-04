import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { getCurrentAuraUser, clearCurrentAuraUser } from '../services/auraAuthService';
import * as supabaseService from '../services/supabaseService';
import {
  AuraUser,
  Task,
  Habit,
  AddictionTracker,
  AddictionLog,
  UserSettings,
  PageView,
  FocusSession,
  ActiveFocusSession,
  TimeEntry,
  ActiveTimeTracker,
  Goal,
  DailyJournal,
} from '../types';
import {
  loadStoredData,
  saveTasks,
  saveHabits,
  saveAddictionTrackers,
  saveAddictionLogs,
  saveSettings,
  saveFocusSessions,
  saveActiveFocus,
  saveTimeEntries,
  saveTimeCategories,
  saveActiveTime,
  saveGoals,
  saveDailyJournals,
  clearAllData,
  getCleanEmptyData,
  DEFAULT_SETTINGS,
} from '../utils/storage';
import { getTodayString } from '../utils/dateUtils';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  // Auth state (Aura Native Email Code Auth)
  user: AuraUser | null;
  authLoading: boolean;
  loginWithUser: (user: AuraUser) => void;
  logout: () => void;
  isSyncing: boolean;

  // Personal data
  tasks: Task[];
  habits: Habit[];
  addictionTrackers: AddictionTracker[];
  addictionLogs: AddictionLog[];
  focusSessions: FocusSession[];
  activeFocus: ActiveFocusSession | null;
  setActiveFocus: (session: ActiveFocusSession | null) => void;
  finishFocusSession: (session: ActiveFocusSession, completed: boolean) => void;
  timeEntries: TimeEntry[];
  timeCategories: string[];
  activeTimeTracker: ActiveTimeTracker | null;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'durationMinutes'>) => boolean;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => boolean;
  deleteTimeEntry: (id: string) => void;
  addTimeCategory: (category: string) => void;
  setActiveTimeTracker: (tracker: ActiveTimeTracker | null) => void;
  stopTimeTracker: () => void;

  // Goals & Journal
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  dailyJournals: DailyJournal[];
  saveDailyJournal: (journal: Omit<DailyJournal, 'id' | 'createdAt'>) => void;
  deleteDailyJournal: (id: string) => void;

  // Workspace settings & UI
  settings: UserSettings;
  currentView: PageView;
  setCurrentView: (view: PageView) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;

  // Task methods
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTaskComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  rescheduleTask: (id: string, newDate: string, newStartTime?: string) => void;

  // Habit methods
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  toggleHabitDay: (id: string, dateStr: string) => void;
  deleteHabit: (id: string) => void;

  // Addiction methods
  addTracker: (tracker: Omit<AddictionTracker, 'id' | 'createdAt'>) => void;
  updateTracker: (id: string, updates: Partial<AddictionTracker>) => void;
  deleteTracker: (id: string) => void;
  logAddictionEntry: (log: Omit<AddictionLog, 'id' | 'timestamp'>) => void;
  deleteAddictionLog: (id: string) => void;

  // Settings & Management
  updateSettings: (updates: Partial<UserSettings>) => void;
  clearData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  syncWithSupabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initial = loadStoredData();

  // Auth State
  const [user, setUser] = useState<AuraUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Data State
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [habits, setHabits] = useState<Habit[]>(initial.habits);
  const [addictionTrackers, setAddictionTrackers] = useState<AddictionTracker[]>(initial.addictionTrackers);
  const [addictionLogs, setAddictionLogs] = useState<AddictionLog[]>(initial.addictionLogs);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(initial.focusSessions);
  const [activeFocus, setActiveFocusState] = useState<ActiveFocusSession | null>(initial.activeFocus);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initial.timeEntries);
  const [timeCategories, setTimeCategories] = useState<string[]>(initial.timeCategories);
  const [activeTimeTracker, setActiveTimeTrackerState] = useState<ActiveTimeTracker | null>(initial.activeTimeTracker);
  const [goals, setGoals] = useState<Goal[]>(initial.goals || []);
  const [dailyJournals, setDailyJournals] = useState<DailyJournal[]>(initial.dailyJournals || []);
  const [settings, setSettingsState] = useState<UserSettings>(initial.settings);
  const [currentView, setCurrentView] = useState<PageView>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 3500);
  }, []);

  // Per-user storage helper
  const getUserKey = (userId: string, key: string) => `aura_u_${userId}_${key}`;

  const loadUserData = useCallback((userId: string) => {
    try {
      const uTasks = localStorage.getItem(getUserKey(userId, 'tasks'));
      const uHabits = localStorage.getItem(getUserKey(userId, 'habits'));
      const uTrackers = localStorage.getItem(getUserKey(userId, 'trackers'));
      const uLogs = localStorage.getItem(getUserKey(userId, 'logs'));
      const uFocus = localStorage.getItem(getUserKey(userId, 'focus'));
      const uTime = localStorage.getItem(getUserKey(userId, 'time'));
      const uGoals = localStorage.getItem(getUserKey(userId, 'goals'));
      const uJournals = localStorage.getItem(getUserKey(userId, 'journals'));
      const uSettings = localStorage.getItem(getUserKey(userId, 'settings'));

      if (uTasks) setTasks(JSON.parse(uTasks));
      if (uHabits) setHabits(JSON.parse(uHabits));
      if (uTrackers) setAddictionTrackers(JSON.parse(uTrackers));
      if (uLogs) setAddictionLogs(JSON.parse(uLogs));
      if (uFocus) setFocusSessions(JSON.parse(uFocus));
      if (uTime) setTimeEntries(JSON.parse(uTime));
      if (uGoals) setGoals(JSON.parse(uGoals));
      if (uJournals) setDailyJournals(JSON.parse(uJournals));
      if (uSettings) setSettingsState(JSON.parse(uSettings));
    } catch (e) {
      console.warn('Error loading user-specific data:', e);
    }
  }, []);

  const saveUserData = (userId: string, key: string, data: any) => {
    try {
      localStorage.setItem(getUserKey(userId, key), JSON.stringify(data));
    } catch (e) {
      console.warn('Error saving user-specific data:', e);
    }
  };

  // Check saved user on mount
  useEffect(() => {
    const savedUser = getCurrentAuraUser();
    if (savedUser) {
      setUser(savedUser);
      loadUserData(savedUser.id);
    }
    setAuthLoading(false);
  }, [loadUserData]);

  const loginWithUser = (newUser: AuraUser) => {
    setUser(newUser);
    loadUserData(newUser.id);
    if (newUser.name && !settings.name) {
      const updated = { ...settings, name: newUser.name };
      setSettingsState(updated);
      saveSettings(updated);
      saveUserData(newUser.id, 'settings', updated);
    }
    setCurrentView('dashboard');
  };

  const logout = () => {
    clearCurrentAuraUser();
    setUser(null);
    const clean = getCleanEmptyData();
    setTasks(clean.tasks);
    setHabits(clean.habits);
    setAddictionTrackers(clean.addictionTrackers);
    setAddictionLogs(clean.addictionLogs);
    setFocusSessions(clean.focusSessions);
    setTimeEntries(clean.timeEntries);
    setGoals([]);
    setDailyJournals([]);
    showToast('Signed out of Aura', 'info');
  };

  const syncWithSupabase = async () => {
    if (!user) return;
    setIsSyncing(true);
    showToast('Syncing workspace data...', 'info');
    try {
      const remoteTasks = await supabaseService.fetchTasks(user.id);
      if (remoteTasks.length > 0) {
        setTasks(remoteTasks);
        saveTasks(remoteTasks);
        saveUserData(user.id, 'tasks', remoteTasks);
      }
      showToast('Workspace synchronized', 'success');
    } catch {
      showToast('Workspace synced locally', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  const setActiveFocus = (session: ActiveFocusSession | null) => {
    setActiveFocusState(session);
    saveActiveFocus(session);
  };

  const setActiveTimeTracker = (tracker: ActiveTimeTracker | null) => {
    setActiveTimeTrackerState(tracker);
    saveActiveTime(tracker);
  };

  const addTimeEntry = (entry: Omit<TimeEntry, 'id' | 'durationMinutes'>): boolean => {
    const start = Date.parse(entry.startedAt);
    const end = Date.parse(entry.endedAt);
    const durationMinutes = Math.max(0, Math.round((end - start) / 60000));
    if (!durationMinutes) {
      showToast('At least one minute is needed to save a time entry.', 'error');
      return false;
    }
    if (
      timeEntries.some(
        (saved) => start < Date.parse(saved.endedAt) && end > Date.parse(saved.startedAt)
      )
    ) {
      showToast('This time overlaps another recorded activity. Edit the existing entry.', 'error');
      return false;
    }
    const record: TimeEntry = {
      ...entry,
      id: `time-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      durationMinutes,
    };
    const next = [record, ...timeEntries];
    setTimeEntries(next);
    saveTimeEntries(next);
    if (user) saveUserData(user.id, 'time', next);

    if (record.taskId) {
      const nextTasks = tasks.map((task) =>
        task.id === record.taskId
          ? { ...task, timeSpentMinutes: (task.timeSpentMinutes || 0) + durationMinutes }
          : task
      );
      setTasks(nextTasks);
      saveTasks(nextTasks);
      if (user) saveUserData(user.id, 'tasks', nextTasks);
    }
    return true;
  };

  const updateTimeEntry = (id: string, updates: Partial<TimeEntry>): boolean => {
    const old = timeEntries.find((entry) => entry.id === id);
    const target = old ? { ...old, ...updates } : undefined;
    if (
      target &&
      timeEntries.some(
        (saved) =>
          saved.id !== id &&
          Date.parse(target.startedAt) < Date.parse(saved.endedAt) &&
          Date.parse(target.endedAt) > Date.parse(saved.startedAt)
      )
    ) {
      showToast('This time overlaps another recorded activity.', 'error');
      return false;
    }
    const next = timeEntries
      .map((entry) => {
        if (entry.id !== id) return entry;
        const merged = { ...entry, ...updates };
        const durationMinutes = Math.max(
          0,
          Math.round((Date.parse(merged.endedAt) - Date.parse(merged.startedAt)) / 60000)
        );
        return { ...merged, durationMinutes };
      })
      .filter((entry) => entry.durationMinutes > 0);

    setTimeEntries(next);
    saveTimeEntries(next);
    if (user) saveUserData(user.id, 'time', next);

    if (old?.focusSessionId) {
      const linked = focusSessions.map((session) =>
        session.id === old.focusSessionId
          ? {
              ...session,
              taskId: target?.taskId,
              taskTitle: target?.activity || session.taskTitle,
              startedAt: target?.startedAt || session.startedAt,
              endedAt: target?.endedAt || session.endedAt,
              durationMinutes: next.find((e) => e.id === id)?.durationMinutes || session.durationMinutes,
            }
          : session
      );
      setFocusSessions(linked);
      saveFocusSessions(linked);
      if (user) saveUserData(user.id, 'focus', linked);
    }

    if (old?.taskId || target?.taskId) {
      const adjusted = next.find((entry) => entry.id === id);
      const nextTasks = tasks.map((task) => {
        let delta = 0;
        if (task.id === old?.taskId) delta -= old.durationMinutes;
        if (task.id === adjusted?.taskId) delta += adjusted.durationMinutes;
        return delta ? { ...task, timeSpentMinutes: Math.max(0, (task.timeSpentMinutes || 0) + delta) } : task;
      });
      setTasks(nextTasks);
      saveTasks(nextTasks);
      if (user) saveUserData(user.id, 'tasks', nextTasks);
    }
    return true;
  };

  const deleteTimeEntry = (id: string) => {
    const old = timeEntries.find((entry) => entry.id === id);
    const next = timeEntries.filter((entry) => entry.id !== id);
    setTimeEntries(next);
    saveTimeEntries(next);
    if (user) saveUserData(user.id, 'time', next);

    if (old?.focusSessionId) {
      const nextFocusSessions = focusSessions.filter((session) => session.id !== old.focusSessionId);
      setFocusSessions(nextFocusSessions);
      saveFocusSessions(nextFocusSessions);
      if (user) saveUserData(user.id, 'focus', nextFocusSessions);
    }
    if (old?.taskId) {
      const nextTasks = tasks.map((task) =>
        task.id === old.taskId
          ? { ...task, timeSpentMinutes: Math.max(0, (task.timeSpentMinutes || 0) - old.durationMinutes) }
          : task
      );
      setTasks(nextTasks);
      saveTasks(nextTasks);
      if (user) saveUserData(user.id, 'tasks', nextTasks);
    }
  };

  const addTimeCategory = (category: string) => {
    const value = category.trim();
    if (!value || timeCategories.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    const next = [...timeCategories, value];
    setTimeCategories(next);
    saveTimeCategories(next);
  };

  const stopTimeTracker = () => {
    if (!activeTimeTracker) return;
    if (
      addTimeEntry({
        category: activeTimeTracker.category,
        activity: activeTimeTracker.activity,
        startedAt: activeTimeTracker.startedAt,
        endedAt: new Date().toISOString(),
        taskId: activeTimeTracker.taskId,
      })
    ) {
      setActiveTimeTracker(null);
    }
  };

  const finishFocusSession = (session: ActiveFocusSession, completed: boolean) => {
    const actualSeconds = Math.max(0, session.durationMinutes * 60 - session.remainingSeconds);
    const actualMinutes = Math.max(1, Math.round(actualSeconds / 60));
    const endedAt = new Date().toISOString();
    const record: FocusSession = {
      id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId: session.taskId,
      taskTitle: session.taskTitle,
      startedAt: new Date(Date.parse(endedAt) - actualSeconds * 1000).toISOString(),
      endedAt,
      durationMinutes: actualMinutes,
      completed,
    };
    const nextSessions = [record, ...focusSessions];
    setFocusSessions(nextSessions);
    saveFocusSessions(nextSessions);
    if (user) saveUserData(user.id, 'focus', nextSessions);

    const task = tasks.find((item) => item.id === session.taskId);
    const category =
      task &&
      ['Study', 'Work', 'Exercise', 'Sleep', 'Social Media', 'Entertainment', 'Personal'].includes(
        task.category
      )
        ? task.category
        : 'Work';
    const timeRecord: TimeEntry = {
      id: `time-focus-${record.id}`,
      focusSessionId: record.id,
      taskId: session.taskId,
      category,
      activity: session.taskTitle,
      startedAt: record.startedAt,
      endedAt: record.endedAt,
      durationMinutes: actualMinutes,
    };
    const nextTimeEntries = [timeRecord, ...timeEntries];
    setTimeEntries(nextTimeEntries);
    saveTimeEntries(nextTimeEntries);
    if (user) saveUserData(user.id, 'time', nextTimeEntries);

    if (session.taskId) {
      const nextTasks = tasks.map((task) =>
        task.id === session.taskId
          ? { ...task, timeSpentMinutes: (task.timeSpentMinutes || 0) + actualMinutes }
          : task
      );
      setTasks(nextTasks);
      saveTasks(nextTasks);
      if (user) saveUserData(user.id, 'tasks', nextTasks);
    }
    setActiveFocus(null);
    showToast(
      completed ? 'Focus session complete. Take a short break.' : 'Focus session saved.',
      'success'
    );
  };

  const triggerConfetti = () => {
    if (!settings.confettiEnabled) return;
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#94B49F', '#82A8D1', '#B8A8D8', '#E6C464'],
        disableForReducedMotion: true,
      });
    } catch {
      // ignore
    }
  };

  // --- Task Operations ---
  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    if (user) saveUserData(user.id, 'tasks', updated);

    showToast(`Task "${newTask.title}" added`, 'success');
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updated);
    saveTasks(updated);
    if (user) saveUserData(user.id, 'tasks', updated);

    showToast('Task updated', 'info');
  };

  const toggleTaskComplete = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const isNowCompleted = !target.completed;
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    if (user) saveUserData(user.id, 'tasks', updated);

    if (isNowCompleted) {
      triggerConfetti();
      showToast(`Completed "${target.title}"`, 'success');
    } else {
      showToast(`Marked "${target.title}" as pending`, 'info');
    }
  };

  const deleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveTasks(updated);
    if (user) saveUserData(user.id, 'tasks', updated);

    showToast(`Deleted task "${target?.title || ''}"`, 'info');
  };

  const rescheduleTask = (id: string, newDate: string, newStartTime?: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const oldDeadline = t.deadline?.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
        let deadline = t.deadline;
        if (newStartTime) {
          const startMinutes = Number(newStartTime.slice(0, 2)) * 60 + Number(newStartTime.slice(3, 5));
          const endMinutes = startMinutes + (t.estimatedDuration || 0);
          if (endMinutes >= 1440) {
            const nextDay = new Date(`${newDate}T12:00:00`);
            nextDay.setDate(nextDay.getDate() + Math.floor(endMinutes / 1440));
            const datePart = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
            deadline = `${datePart} ${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
          } else {
            deadline = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
          }
        } else if (oldDeadline) {
          const offsetDays = Math.round((Date.parse(`${oldDeadline[1]}T12:00:00`) - Date.parse(`${t.date}T12:00:00`)) / 86400000);
          const endDate = new Date(`${newDate}T12:00:00`);
          endDate.setDate(endDate.getDate() + offsetDays);
          const datePart = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
          deadline = `${datePart} ${oldDeadline[2]}`;
        }
        return {
          ...t,
          date: newDate,
          startTime: newStartTime !== undefined ? newStartTime : t.startTime,
          deadline,
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
    if (user) saveUserData(user.id, 'tasks', updated);

    showToast(`Rescheduled to ${newDate}`, 'info');
  };

  // --- Habit Operations ---
  const addHabit = (habitInput: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => {
    const newHabit: Habit = {
      ...habitInput,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: getTodayString(),
      completions: {},
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
    if (user) saveUserData(user.id, 'habits', updated);

    showToast(`Habit "${newHabit.title}" created`, 'success');
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    const updated = habits.map((h) => (h.id === id ? { ...h, ...updates } : h));
    setHabits(updated);
    saveHabits(updated);
    if (user) saveUserData(user.id, 'habits', updated);

    showToast('Habit updated', 'info');
  };

  const toggleHabitDay = (id: string, dateStr: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;

    const currentCount = target.completions[dateStr] || 0;
    const targetCount = target.targetCount || 1;
    const isCompleted = currentCount >= targetCount;
    const newCount = isCompleted ? 0 : targetCount;

    const updated = habits.map((h) => {
      if (h.id === id) {
        const nextCompletions = { ...h.completions };
        if (newCount === 0) {
          delete nextCompletions[dateStr];
        } else {
          nextCompletions[dateStr] = newCount;
        }
        return { ...h, completions: nextCompletions };
      }
      return h;
    });

    setHabits(updated);
    saveHabits(updated);
    if (user) saveUserData(user.id, 'habits', updated);

    if (!isCompleted) {
      triggerConfetti();
      showToast(
        `Habit "${target.title}" completed for ${dateStr === getTodayString() ? 'today' : dateStr}`,
        'success'
      );
    }
  };

  const deleteHabit = (id: string) => {
    const target = habits.find((h) => h.id === id);
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    saveHabits(updated);
    if (user) saveUserData(user.id, 'habits', updated);

    showToast(`Habit "${target?.title}" removed`, 'info');
  };

  // --- Addiction Operations ---
  const addTracker = (trackerInput: Omit<AddictionTracker, 'id' | 'createdAt'>) => {
    const newTracker: AddictionTracker = {
      ...trackerInput,
      id: `addict-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: getTodayString(),
    };
    const updated = [...addictionTrackers, newTracker];
    setAddictionTrackers(updated);
    saveAddictionTrackers(updated);
    if (user) saveUserData(user.id, 'trackers', updated);

    showToast(`Tracker "${newTracker.name}" created`, 'success');
  };

  const updateTracker = (id: string, updates: Partial<AddictionTracker>) => {
    const updated = addictionTrackers.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setAddictionTrackers(updated);
    saveAddictionTrackers(updated);
    if (user) saveUserData(user.id, 'trackers', updated);

    showToast('Tracker updated', 'info');
  };

  const deleteTracker = (id: string) => {
    const target = addictionTrackers.find((t) => t.id === id);
    const updated = addictionTrackers.filter((t) => t.id !== id);
    const updatedLogs = addictionLogs.filter((l) => l.trackerId !== id);
    setAddictionTrackers(updated);
    setAddictionLogs(updatedLogs);
    saveAddictionTrackers(updated);
    saveAddictionLogs(updatedLogs);
    if (user) {
      saveUserData(user.id, 'trackers', updated);
      saveUserData(user.id, 'logs', updatedLogs);
    }

    showToast(`Tracker "${target?.name}" removed`, 'info');
  };

  const logAddictionEntry = (logInput: Omit<AddictionLog, 'id' | 'timestamp'>) => {
    const newLog: AddictionLog = {
      ...logInput,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...addictionLogs];
    setAddictionLogs(updated);
    saveAddictionLogs(updated);
    if (user) saveUserData(user.id, 'logs', updated);

    showToast('Logged occurrence with constructive reflection', 'info');
  };

  const deleteAddictionLog = (id: string) => {
    const updated = addictionLogs.filter((l) => l.id !== id);
    setAddictionLogs(updated);
    saveAddictionLogs(updated);
    if (user) saveUserData(user.id, 'logs', updated);

    showToast('Log entry removed', 'info');
  };

  // --- Goals Operations ---
  const addGoal = (goalInput: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goalInput,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    saveGoals(updated);
    if (user) saveUserData(user.id, 'goals', updated);

    showToast(`Goal "${newGoal.title}" added`, 'success');
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    setGoals(updated);
    saveGoals(updated);
    if (user) saveUserData(user.id, 'goals', updated);

    showToast('Goal updated', 'info');
  };

  const deleteGoal = (id: string) => {
    const target = goals.find((g) => g.id === id);
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
    if (user) saveUserData(user.id, 'goals', updated);

    showToast(`Goal "${target?.title || ''}" removed`, 'info');
  };

  // --- Daily Journals ---
  const saveDailyJournal = (journalInput: Omit<DailyJournal, 'id' | 'createdAt'>) => {
    const existing = dailyJournals.find((j) => j.date === journalInput.date);
    let updated: DailyJournal[];
    let target: DailyJournal;

    if (existing) {
      target = { ...existing, ...journalInput };
      updated = dailyJournals.map((j) => (j.id === existing.id ? target : j));
    } else {
      target = {
        ...journalInput,
        id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
      };
      updated = [target, ...dailyJournals];
    }

    setDailyJournals(updated);
    saveDailyJournals(updated);
    if (user) saveUserData(user.id, 'journals', updated);

    showToast('Daily reflection saved', 'success');
  };

  const deleteDailyJournal = (id: string) => {
    const updated = dailyJournals.filter((j) => j.id !== id);
    setDailyJournals(updated);
    saveDailyJournals(updated);
    if (user) saveUserData(user.id, 'journals', updated);

    showToast('Journal entry deleted', 'info');
  };

  // --- Settings & Data Management ---
  const updateSettings = (updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    setSettingsState(updated);
    saveSettings(updated);
    if (user) saveUserData(user.id, 'settings', updated);

    showToast('Settings saved', 'success');
  };

  const clearData = () => {
    const empty = clearAllData();
    setTasks(empty.tasks);
    setHabits(empty.habits);
    setAddictionTrackers(empty.addictionTrackers);
    setAddictionLogs(empty.addictionLogs);
    setFocusSessions(empty.focusSessions);
    setActiveFocusState(null);
    setTimeEntries(empty.timeEntries);
    setTimeCategories(empty.timeCategories);
    setActiveTimeTrackerState(null);
    setSettingsState(empty.settings);
    setGoals([]);
    setDailyJournals([]);
    showToast('All personal records cleared', 'info');
  };

  const exportDataJSON = () => {
    const payload = {
      tasks,
      habits,
      addictionTrackers,
      addictionLogs,
      focusSessions,
      activeFocus,
      timeEntries,
      timeCategories,
      activeTimeTracker,
      goals,
      dailyJournals,
      settings,
      user,
      exportedAt: new Date().toISOString(),
      version: '3.0',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-backup-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported backup JSON file', 'success');
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      const importedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const importedHabits = Array.isArray(data.habits) ? data.habits : [];
      const importedTrackers = Array.isArray(data.addictionTrackers) ? data.addictionTrackers : [];
      const importedLogs = Array.isArray(data.addictionLogs) ? data.addictionLogs : [];
      const importedFocusSessions = Array.isArray(data.focusSessions) ? data.focusSessions : [];
      const importedTimeEntries = Array.isArray(data.timeEntries) ? data.timeEntries : [];
      const importedTimeCategories = Array.isArray(data.timeCategories) ? data.timeCategories : initial.timeCategories;
      const importedGoals = Array.isArray(data.goals) ? data.goals : [];
      const importedJournals = Array.isArray(data.dailyJournals) ? data.dailyJournals : [];
      const importedSettings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : settings;

      setTasks(importedTasks);
      saveTasks(importedTasks);

      setHabits(importedHabits);
      saveHabits(importedHabits);

      setAddictionTrackers(importedTrackers);
      saveAddictionTrackers(importedTrackers);

      setAddictionLogs(importedLogs);
      saveAddictionLogs(importedLogs);

      setFocusSessions(importedFocusSessions);
      saveFocusSessions(importedFocusSessions);
      setActiveFocus(data.activeFocus || null);

      setTimeEntries(importedTimeEntries);
      saveTimeEntries(importedTimeEntries);

      setTimeCategories(importedTimeCategories);
      saveTimeCategories(importedTimeCategories);
      setActiveTimeTracker(data.activeTimeTracker || null);

      setGoals(importedGoals);
      saveGoals(importedGoals);

      setDailyJournals(importedJournals);
      saveDailyJournals(importedJournals);

      setSettingsState(importedSettings);
      saveSettings(importedSettings);

      if (user) {
        saveUserData(user.id, 'tasks', importedTasks);
        saveUserData(user.id, 'habits', importedHabits);
        saveUserData(user.id, 'trackers', importedTrackers);
        saveUserData(user.id, 'time', importedTimeEntries);
      }

      showToast('Personal data imported successfully!', 'success');
      return true;
    } catch (e) {
      console.error('Import failed', e);
      showToast('Invalid JSON file format', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        loginWithUser,
        logout,
        isSyncing,
        tasks,
        habits,
        addictionTrackers,
        addictionLogs,
        focusSessions,
        activeFocus,
        setActiveFocus,
        finishFocusSession,
        timeEntries,
        timeCategories,
        activeTimeTracker,
        addTimeEntry,
        updateTimeEntry,
        deleteTimeEntry,
        addTimeCategory,
        setActiveTimeTracker,
        stopTimeTracker,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        dailyJournals,
        saveDailyJournal,
        deleteDailyJournal,
        settings,
        currentView,
        setCurrentView,
        selectedDate,
        setSelectedDate,
        toast,
        showToast,
        addTask,
        updateTask,
        toggleTaskComplete,
        deleteTask,
        rescheduleTask,
        addHabit,
        updateHabit,
        toggleHabitDay,
        deleteHabit,
        addTracker,
        updateTracker,
        deleteTracker,
        logAddictionEntry,
        deleteAddictionLog,
        updateSettings,
        clearData,
        exportDataJSON,
        importDataJSON,
        syncWithSupabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
