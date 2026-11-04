import { supabase } from '../lib/supabase';
import {
  Task,
  Habit,
  AddictionTracker,
  AddictionLog,
  FocusSession,
  TimeEntry,
  UserSettings,
  Goal,
  DailyJournal,
} from '../types';

// ==========================================
// User Settings
// ==========================================

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Failed to fetch user_settings:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      name: data.name || '',
      greetingTitle: data.greeting_title || '',
      dailyTaskGoal: data.daily_task_goal ?? 3,
      confettiEnabled: data.confetti_enabled ?? true,
      notificationsEnabled: data.notifications_enabled ?? true,
    };
  } catch (err) {
    console.warn('[Supabase] fetchUserSettings error:', err);
    return null;
  }
}

export async function upsertUserSettings(userId: string, settings: UserSettings): Promise<boolean> {
  try {
    const payload = {
      user_id: userId,
      name: settings.name,
      greeting_title: settings.greetingTitle,
      daily_task_goal: settings.dailyTaskGoal,
      confetti_enabled: settings.confettiEnabled,
      notifications_enabled: settings.notificationsEnabled,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.warn('[Supabase] Failed to upsert user_settings:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertUserSettings error:', err);
    return false;
  }
}

// ==========================================
// Tasks
// ==========================================

export async function fetchTasks(userId: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchTasks error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      date: row.date,
      startTime: row.start_time || undefined,
      deadline: row.deadline || undefined,
      priority: row.priority,
      category: row.category,
      estimatedDuration: row.estimated_duration ?? 30,
      timeSpentMinutes: row.time_spent_minutes ?? 0,
      completed: !!row.completed,
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchTasks exception:', err);
    return [];
  }
}

export async function upsertTask(userId: string, task: Task): Promise<boolean> {
  try {
    const row = {
      id: task.id,
      user_id: userId,
      title: task.title,
      description: task.description || '',
      date: task.date,
      start_time: task.startTime || null,
      deadline: task.deadline || null,
      priority: task.priority,
      category: task.category,
      estimated_duration: task.estimatedDuration,
      time_spent_minutes: task.timeSpentMinutes || 0,
      completed: task.completed,
      completed_at: task.completedAt || null,
      created_at: task.createdAt,
    };

    const { error } = await supabase.from('tasks').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertTask error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertTask exception:', err);
    return false;
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteTask error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteTask exception:', err);
    return false;
  }
}

// ==========================================
// Habits
// ==========================================

export async function fetchHabits(userId: string): Promise<Habit[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchHabits error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      category: row.category,
      frequency: row.frequency,
      customDays: Array.isArray(row.custom_days) ? row.custom_days : [],
      targetCount: row.target_count ?? 1,
      unit: row.unit || 'times',
      color: row.color || 'sage',
      icon: row.icon || 'Sparkles',
      createdAt: row.created_at,
      completions: row.completions && typeof row.completions === 'object' ? row.completions : {},
    }));
  } catch (err) {
    console.warn('[Supabase] fetchHabits exception:', err);
    return [];
  }
}

export async function upsertHabit(userId: string, habit: Habit): Promise<boolean> {
  try {
    const row = {
      id: habit.id,
      user_id: userId,
      title: habit.title,
      description: habit.description || '',
      category: habit.category,
      frequency: habit.frequency,
      custom_days: habit.customDays || [],
      target_count: habit.targetCount,
      unit: habit.unit || 'times',
      color: habit.color,
      icon: habit.icon,
      created_at: habit.createdAt,
      completions: habit.completions || {},
    };

    const { error } = await supabase.from('habits').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertHabit error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertHabit exception:', err);
    return false;
  }
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteHabit error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteHabit exception:', err);
    return false;
  }
}

// ==========================================
// Addiction Trackers & Logs
// ==========================================

export async function fetchAddictionTrackers(userId: string): Promise<AddictionTracker[]> {
  try {
    const { data, error } = await supabase
      .from('addiction_trackers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchAddictionTrackers error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      dailyLimitMinutes: row.daily_limit_minutes ?? 0,
      reductionGoal: row.reduction_goal || 'Zero consumption',
      color: row.color || 'rose',
      icon: row.icon || 'Shield',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchAddictionTrackers exception:', err);
    return [];
  }
}

export async function upsertAddictionTracker(userId: string, tracker: AddictionTracker): Promise<boolean> {
  try {
    const row = {
      id: tracker.id,
      user_id: userId,
      name: tracker.name,
      description: tracker.description || '',
      daily_limit_minutes: tracker.dailyLimitMinutes,
      reduction_goal: tracker.reductionGoal,
      color: tracker.color,
      icon: tracker.icon,
      created_at: tracker.createdAt,
    };

    const { error } = await supabase.from('addiction_trackers').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertAddictionTracker error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertAddictionTracker exception:', err);
    return false;
  }
}

export async function deleteAddictionTracker(userId: string, trackerId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('addiction_trackers').delete().eq('id', trackerId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteAddictionTracker error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteAddictionTracker exception:', err);
    return false;
  }
}

export async function fetchAddictionLogs(userId: string): Promise<AddictionLog[]> {
  try {
    const { data, error } = await supabase
      .from('addiction_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchAddictionLogs error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      trackerId: row.tracker_id,
      date: row.date,
      timestamp: row.timestamp,
      durationMinutes: row.duration_minutes ?? 0,
      trigger: row.trigger || 'habit',
      note: row.note || '',
    }));
  } catch (err) {
    console.warn('[Supabase] fetchAddictionLogs exception:', err);
    return [];
  }
}

export async function upsertAddictionLog(userId: string, log: AddictionLog): Promise<boolean> {
  try {
    const row = {
      id: log.id,
      user_id: userId,
      tracker_id: log.trackerId,
      date: log.date,
      timestamp: log.timestamp,
      duration_minutes: log.durationMinutes,
      trigger: log.trigger,
      note: log.note || '',
    };

    const { error } = await supabase.from('addiction_logs').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertAddictionLog error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertAddictionLog exception:', err);
    return false;
  }
}

export async function deleteAddictionLog(userId: string, logId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('addiction_logs').delete().eq('id', logId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteAddictionLog error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteAddictionLog exception:', err);
    return false;
  }
}

// ==========================================
// Focus Sessions
// ==========================================

export async function fetchFocusSessions(userId: string): Promise<FocusSession[]> {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchFocusSessions error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      taskId: row.task_id || undefined,
      taskTitle: row.task_title,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMinutes: row.duration_minutes,
      completed: !!row.completed,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchFocusSessions exception:', err);
    return [];
  }
}

export async function insertFocusSession(userId: string, session: FocusSession): Promise<boolean> {
  try {
    const row = {
      id: session.id,
      user_id: userId,
      task_id: session.taskId || null,
      task_title: session.taskTitle,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      duration_minutes: session.durationMinutes,
      completed: session.completed,
    };

    const { error } = await supabase.from('focus_sessions').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] insertFocusSession error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] insertFocusSession exception:', err);
    return false;
  }
}

// ==========================================
// Time Entries & Categories
// ==========================================

export async function fetchTimeEntries(userId: string): Promise<TimeEntry[]> {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchTimeEntries error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      category: row.category,
      activity: row.activity,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      durationMinutes: row.duration_minutes,
      taskId: row.task_id || undefined,
      focusSessionId: row.focus_session_id || undefined,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchTimeEntries exception:', err);
    return [];
  }
}

export async function upsertTimeEntry(userId: string, entry: TimeEntry): Promise<boolean> {
  try {
    const row = {
      id: entry.id,
      user_id: userId,
      category: entry.category,
      activity: entry.activity,
      started_at: entry.startedAt,
      ended_at: entry.endedAt,
      duration_minutes: entry.durationMinutes,
      task_id: entry.taskId || null,
      focus_session_id: entry.focusSessionId || null,
    };

    const { error } = await supabase.from('time_entries').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertTimeEntry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertTimeEntry exception:', err);
    return false;
  }
}

export async function deleteTimeEntry(userId: string, entryId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('time_entries').delete().eq('id', entryId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteTimeEntry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteTimeEntry exception:', err);
    return false;
  }
}

// ==========================================
// Goals & Journals
// ==========================================

export async function fetchGoals(userId: string): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchGoals error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category || 'Personal',
      targetDate: row.target_date || undefined,
      progress: row.progress ?? 0,
      status: row.status || 'in_progress',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchGoals exception:', err);
    return [];
  }
}

export async function upsertGoal(userId: string, goal: Goal): Promise<boolean> {
  try {
    const row = {
      id: goal.id,
      user_id: userId,
      title: goal.title,
      category: goal.category,
      target_date: goal.targetDate || null,
      progress: goal.progress,
      status: goal.status,
      created_at: goal.createdAt,
    };

    const { error } = await supabase.from('goals').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertGoal error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertGoal exception:', err);
    return false;
  }
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', userId);
    if (error) {
      console.warn('[Supabase] deleteGoal error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] deleteGoal exception:', err);
    return false;
  }
}

export async function fetchJournals(userId: string): Promise<DailyJournal[]> {
  try {
    const { data, error } = await supabase
      .from('daily_journals')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchJournals error:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      content: row.content,
      mood: row.mood || 'calm',
      gratitude: row.gratitude || '',
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchJournals exception:', err);
    return [];
  }
}

export async function upsertJournal(userId: string, journal: DailyJournal): Promise<boolean> {
  try {
    const row = {
      id: journal.id,
      user_id: userId,
      date: journal.date,
      content: journal.content,
      mood: journal.mood || 'calm',
      gratitude: journal.gratitude || '',
      created_at: journal.createdAt,
    };

    const { error } = await supabase.from('daily_journals').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase] upsertJournal error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] upsertJournal exception:', err);
    return false;
  }
}

// Health check / table readiness check
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; tablesDetected: string[] }> {
  try {
    const results: string[] = [];
    const tables = ['tasks', 'habits', 'addiction_trackers', 'focus_sessions', 'time_entries', 'user_settings'];
    for (const tbl of tables) {
      const { error } = await supabase.from(tbl).select('count', { count: 'exact', head: true });
      if (!error) {
        results.push(tbl);
      }
    }

    return {
      ok: true,
      message: results.length === tables.length ? 'All tables connected' : `${results.length}/${tables.length} tables found`,
      tablesDetected: results,
    };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Connection test failed', tablesDetected: [] };
  }
}
