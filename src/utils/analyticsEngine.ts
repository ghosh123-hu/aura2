import { Task, Habit, AddictionTracker, AddictionLog, ProductivityInsight } from '../types';
import { getTodayString, getDaysAgo, getPastNDays } from './dateUtils';
import { parseISO, format, getDay } from 'date-fns';

export interface CalculatedTaskStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // 0 to 100
  todayTotal: number;
  todayCompleted: number;
  todayPending: number;
  todayOverdue: number;
  todayCompletionRate: number;
  mostProductiveDayName: string | null;
  onTimeCompletions: number;
  overdueCompletions: number;
  avgDurationMinutes: number;
  currentStreakDays: number;
  dailyCompletionHistory: { date: string; label: string; completed: number; created: number }[];
  categoryBreakdown: { name: string; count: number; completed: number; color: string }[];
  priorityBreakdown: { name: string; count: number; completed: number }[];
}

export interface CalculatedHabitStats {
  overallConsistency: number | null; // % or null if no habits
  totalHabits: number;
  activeStreakHabit: { name: string; streak: number } | null;
  longestStreakHabit: { name: string; streak: number } | null;
  habitPerformanceList: {
    habit: Habit;
    currentStreak: number;
    longestStreak: number;
    completionRate30Days: number;
    completedToday: boolean;
    weeklyProgress: { day: string; date: string; completed: boolean }[];
  }[];
  weeklyCompletionTrends: { day: string; date: string; completions: number; totalPossible: number }[];
}

export interface CalculatedAddictionStats {
  totalLoggedMinutesThisWeek: number;
  totalLoggedMinutesLastWeek: number;
  percentChangeVsLastWeek: number | null; // null if insufficient data
  setbacksThisMonth: number;
  daysMeetingGoalThisMonth: number | null; // null if no trackers
  averageDailyTimeThisMonth: number | null; // null if no logs
  improvementVsPreviousMonth: number | null; // null if insufficient historical data
  bestPerformingWeekLabel: string | null; // null if insufficient data
  triggerDistribution: { trigger: string; count: number; minutes: number }[];
  dailyTimeTrends: { date: string; label: string; minutes: number; limit: number }[];
  trackerSummaries: {
    tracker: AddictionTracker;
    cleanStreakDays: number;
    todayMinutes: number;
    todayLogsCount: number;
    isWithinLimitToday: boolean;
    weeklyMinutes: number;
  }[];
}

// -------------------------------------------------------------
// TASK ANALYTICS
// -------------------------------------------------------------
export function calculateTaskStats(tasks: Task[]): CalculatedTaskStats {
  const today = getTodayString();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < today).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const todayTasks = tasks.filter((t) => t.date === today);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPending = todayTasks.filter((t) => !t.completed).length;
  const todayOverdue = tasks.filter((t) => !t.completed && t.date < today).length;
  const todayCompletionRate =
    todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  // Day of week productivity calculation (0 = Sunday, 1 = Monday ...)
  // ONLY calculate from actual completed tasks. If none exist, return null!
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCompletionCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  let hasAnyCompleted = false;

  tasks.forEach((t) => {
    if (t.completed) {
      const dateToUse = t.completedAt ? t.completedAt.split('T')[0] : t.date;
      try {
        const d = parseISO(dateToUse);
        const dayIdx = getDay(d);
        if (!isNaN(dayIdx)) {
          dayCompletionCounts[dayIdx]++;
          hasAnyCompleted = true;
        }
      } catch {
        // ignore
      }
    }
  });

  let mostProductiveDayName: string | null = null;
  if (hasAnyCompleted) {
    let maxDayIdx = -1;
    let maxDayCount = 0;
    dayCompletionCounts.forEach((count, idx) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        maxDayIdx = idx;
      }
    });
    if (maxDayIdx !== -1 && maxDayCount > 0) {
      mostProductiveDayName = dayNames[maxDayIdx];
    }
  }

  // On-time vs Overdue completion
  let onTimeCompletions = 0;
  let overdueCompletions = 0;
  tasks.forEach((t) => {
    if (t.completed) {
      if (t.completedAt) {
        const compDate = t.completedAt.split('T')[0];
        if (compDate <= t.date) {
          onTimeCompletions++;
        } else {
          overdueCompletions++;
        }
      } else {
        onTimeCompletions++;
      }
    }
  });

  // Average duration in minutes strictly from actual user tasks
  const tasksWithDuration = tasks.filter((t) => typeof t.estimatedDuration === 'number' && t.estimatedDuration > 0);
  const totalEstimatedDuration = tasksWithDuration.reduce((sum, t) => sum + t.estimatedDuration, 0);
  const avgDurationMinutes = tasksWithDuration.length > 0 ? Math.round(totalEstimatedDuration / tasksWithDuration.length) : 0;

  // Streak calculation: strictly consecutive days in the past with at least 1 completed task
  let currentStreakDays = 0;
  if (completedTasks > 0) {
    let checkDay = 0;
    while (checkDay < 60) {
      const dStr = getDaysAgo(checkDay);
      const dayHasCompleted = tasks.some(
        (t) => t.completed && (t.date === dStr || (t.completedAt && t.completedAt.startsWith(dStr)))
      );
      if (dayHasCompleted) {
        currentStreakDays++;
        checkDay++;
      } else {
        // If today has no completed task yet, check if yesterday was completed
        if (checkDay === 0) {
          checkDay++;
          continue;
        }
        break;
      }
    }
  }

  // Last 7 days history
  const last7Days = getPastNDays(7);
  const dailyCompletionHistory = last7Days.map((date) => {
    const compCount = tasks.filter(
      (t) => t.completed && (t.date === date || (t.completedAt && t.completedAt.startsWith(date)))
    ).length;
    const createdCount = tasks.filter((t) => t.date === date).length;
    return {
      date,
      label: format(parseISO(date), 'EEE'),
      completed: compCount,
      created: createdCount,
    };
  });

  // Category breakdown
  const categoryMap: Record<string, { count: number; completed: number }> = {};
  const categoryColors: Record<string, string> = {
    Work: '#94B49F',
    Study: '#B8A8D8',
    Health: '#82A8D1',
    Personal: '#E6C464',
    Finance: '#E29587',
    Creative: '#A8C3A0',
  };

  tasks.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, completed: 0 };
    }
    categoryMap[cat].count++;
    if (t.completed) categoryMap[cat].completed++;
  });

  const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    count: data.count,
    completed: data.completed,
    color: categoryColors[name] || '#9BB7D4',
  }));

  // Priority breakdown
  const priorityMap: Record<string, { count: number; completed: number }> = {
    high: { count: 0, completed: 0 },
    medium: { count: 0, completed: 0 },
    low: { count: 0, completed: 0 },
  };
  tasks.forEach((t) => {
    const p = t.priority || 'medium';
    if (priorityMap[p]) {
      priorityMap[p].count++;
      if (t.completed) priorityMap[p].completed++;
    }
  });

  const priorityBreakdown = [
    { name: 'High', count: priorityMap.high.count, completed: priorityMap.high.completed },
    { name: 'Medium', count: priorityMap.medium.count, completed: priorityMap.medium.completed },
    { name: 'Low', count: priorityMap.low.count, completed: priorityMap.low.completed },
  ];

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
    todayTotal: todayTasks.length,
    todayCompleted,
    todayPending,
    todayOverdue,
    todayCompletionRate,
    mostProductiveDayName,
    onTimeCompletions,
    overdueCompletions,
    avgDurationMinutes,
    currentStreakDays,
    dailyCompletionHistory,
    categoryBreakdown,
    priorityBreakdown,
  };
}

// -------------------------------------------------------------
// HABIT ANALYTICS & STREAKS
// -------------------------------------------------------------
export function calculateHabitStats(habits: Habit[]): CalculatedHabitStats {
  if (habits.length === 0) {
    return {
      overallConsistency: null,
      totalHabits: 0,
      activeStreakHabit: null,
      longestStreakHabit: null,
      habitPerformanceList: [],
      weeklyCompletionTrends: getPastNDays(7).map((date) => ({
        date,
        day: format(parseISO(date), 'EEE'),
        completions: 0,
        totalPossible: 0,
      })),
    };
  }

  const today = getTodayString();
  const past30Days = getPastNDays(30);
  const past7Days = getPastNDays(7);

  let totalPossibleCompletions = 0;
  let totalActualCompletions = 0;

  const habitPerformanceList = habits.map((habit) => {
    const hasAnyLogged = Object.keys(habit.completions || {}).length > 0;

    let currentStreak = 0;
    if (hasAnyLogged) {
      let checkDay = 0;
      while (checkDay < 60) {
        const dStr = getDaysAgo(checkDay);
        const isDone = (habit.completions[dStr] || 0) >= (habit.targetCount || 1);
        if (isDone) {
          currentStreak++;
          checkDay++;
        } else {
          if (checkDay === 0) {
            checkDay++;
            continue;
          }
          break;
        }
      }
    }

    let longestStreak = 0;
    if (hasAnyLogged) {
      let tempStreak = 0;
      for (let i = 59; i >= 0; i--) {
        const dStr = getDaysAgo(i);
        const isDone = (habit.completions[dStr] || 0) >= (habit.targetCount || 1);
        if (isDone) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    }

    let completedIn30Days = 0;
    past30Days.forEach((date) => {
      const isDone = (habit.completions[date] || 0) >= (habit.targetCount || 1);
      if (isDone) completedIn30Days++;
      totalActualCompletions += isDone ? 1 : 0;
      totalPossibleCompletions++;
    });

    const completionRate30Days = Math.round((completedIn30Days / 30) * 100);
    const completedToday = (habit.completions[today] || 0) >= (habit.targetCount || 1);

    const weeklyProgress = past7Days.map((date) => ({
      date,
      day: format(parseISO(date), 'EEEEE'),
      completed: (habit.completions[date] || 0) >= (habit.targetCount || 1),
    }));

    return {
      habit,
      currentStreak,
      longestStreak,
      completionRate30Days,
      completedToday,
      weeklyProgress,
    };
  });

  const overallConsistency =
    totalPossibleCompletions > 0
      ? Math.round((totalActualCompletions / totalPossibleCompletions) * 100)
      : 0;

  let topStreakHabit: { name: string; streak: number } | null = null;
  let topLongestHabit: { name: string; streak: number } | null = null;

  habitPerformanceList.forEach((item) => {
    if (item.currentStreak > 0 && (!topStreakHabit || item.currentStreak > topStreakHabit.streak)) {
      topStreakHabit = { name: item.habit.title, streak: item.currentStreak };
    }
    if (item.longestStreak > 0 && (!topLongestHabit || item.longestStreak > topLongestHabit.streak)) {
      topLongestHabit = { name: item.habit.title, streak: item.longestStreak };
    }
  });

  const weeklyCompletionTrends = past7Days.map((date) => {
    let comps = 0;
    habits.forEach((h) => {
      if ((h.completions[date] || 0) >= (h.targetCount || 1)) {
        comps++;
      }
    });
    return {
      date,
      day: format(parseISO(date), 'EEE'),
      completions: comps,
      totalPossible: habits.length,
    };
  });

  return {
    overallConsistency,
    totalHabits: habits.length,
    activeStreakHabit: topStreakHabit,
    longestStreakHabit: topLongestHabit,
    habitPerformanceList,
    weeklyCompletionTrends,
  };
}

// -------------------------------------------------------------
// ADDICTION & BAD HABIT ANALYTICS
// -------------------------------------------------------------
export function calculateAddictionStats(
  trackers: AddictionTracker[],
  logs: AddictionLog[]
): CalculatedAddictionStats {
  const past7Days = getPastNDays(7);
  const previous7Days: string[] = [];
  for (let i = 13; i >= 7; i--) {
    previous7Days.push(getDaysAgo(i));
  }
  const past30Days = getPastNDays(30);

  const hasAnyLogs = logs.length > 0;
  const hasAnyTrackers = trackers.length > 0;

  // Minutes this week vs last week
  const minutesThisWeek = logs
    .filter((l) => past7Days.includes(l.date))
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  const minutesLastWeek = logs
    .filter((l) => previous7Days.includes(l.date))
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  // Percent change: ONLY calculate if there are actual logs in prior period!
  let percentChangeVsLastWeek: number | null = null;
  if (minutesLastWeek > 0) {
    percentChangeVsLastWeek = Math.round(
      ((minutesThisWeek - minutesLastWeek) / minutesLastWeek) * 100
    );
  }

  // Monthly stats
  const monthlyLogs = logs.filter((l) => past30Days.includes(l.date));
  let averageDailyTimeThisMonth: number | null = null;
  if (monthlyLogs.length > 0) {
    const totalMinutesThisMonth = monthlyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    // Average across days that had logs
    const uniqueLoggedDays = new Set(monthlyLogs.map((l) => l.date)).size;
    averageDailyTimeThisMonth = Math.round(totalMinutesThisMonth / Math.max(uniqueLoggedDays, 1));
  }

  // Setbacks & Days Meeting Goal
  let setbacksThisMonth = 0;
  let daysMeetingGoalThisMonth: number | null = null;

  if (hasAnyTrackers) {
    // A setback is an actual day where user logged time that exceeded that tracker's limit
    const daysWithViolations = new Set<string>();
    monthlyLogs.forEach((l) => {
      const tracker = trackers.find((t) => t.id === l.trackerId);
      if (tracker) {
        const dayTrackerMinutes = monthlyLogs
          .filter((log) => log.trackerId === tracker.id && log.date === l.date)
          .reduce((sum, log) => sum + log.durationMinutes, 0);
        if (dayTrackerMinutes > tracker.dailyLimitMinutes) {
          daysWithViolations.add(l.date);
        }
      }
    });

    setbacksThisMonth = daysWithViolations.size;

    // Days meeting goal: only count days since user created trackers where limit was not violated
    // If no logs exist, don't invent 30 days!
    if (hasAnyLogs) {
      daysMeetingGoalThisMonth = Math.max(0, 30 - setbacksThisMonth);
    }
  }

  // Improvement comparison vs previous 30 days:
  // Strict calculation: sum logs from 60-31 days ago vs 30-0 days ago
  let improvementVsPreviousMonth: number | null = null;
  const previous30Days: string[] = [];
  for (let i = 59; i >= 30; i--) {
    previous30Days.push(getDaysAgo(i));
  }
  const priorMonthMinutes = logs
    .filter((l) => previous30Days.includes(l.date))
    .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
  const currentMonthMinutes = monthlyLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

  if (priorMonthMinutes > 0) {
    // If minutes decreased, positive improvement
    improvementVsPreviousMonth = Math.round(
      ((priorMonthMinutes - currentMonthMinutes) / priorMonthMinutes) * 100
    );
  }

  // Best performing week: calculate from real weekly buckets if at least 14 days of data exist
  let bestPerformingWeekLabel: string | null = null;
  if (hasAnyLogs && (minutesThisWeek > 0 || minutesLastWeek > 0)) {
    if (minutesLastWeek > 0 && minutesThisWeek < minutesLastWeek) {
      bestPerformingWeekLabel = 'This Week (Improved focus)';
    } else if (minutesLastWeek > 0 && minutesThisWeek >= minutesLastWeek) {
      bestPerformingWeekLabel = 'Last Week';
    } else if (minutesThisWeek > 0) {
      bestPerformingWeekLabel = 'Active Week (Under observation)';
    }
  }

  // Trigger distribution from actual user logs only
  const triggerMap: Record<string, { count: number; minutes: number }> = {};
  logs.forEach((log) => {
    const tr = log.trigger || 'other';
    if (!triggerMap[tr]) triggerMap[tr] = { count: 0, minutes: 0 };
    triggerMap[tr].count++;
    triggerMap[tr].minutes += log.durationMinutes || 0;
  });

  const triggerDistribution = Object.entries(triggerMap)
    .filter(([_, data]) => data.count > 0)
    .map(([trigger, data]) => ({
      trigger: trigger.charAt(0).toUpperCase() + trigger.slice(1),
      count: data.count,
      minutes: data.minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  // Daily time trends for last 14 days
  const past14Days = getPastNDays(14);
  const dailyTimeTrends = past14Days.map((date) => {
    const dayMins = logs
      .filter((l) => l.date === date)
      .reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    const totalLimit = trackers.reduce((sum, t) => sum + t.dailyLimitMinutes, 0);

    return {
      date,
      label: format(parseISO(date), 'MMM d'),
      minutes: dayMins,
      limit: totalLimit,
    };
  });

  // Per-tracker summaries
  const today = getTodayString();
  const trackerSummaries = trackers.map((tracker) => {
    let cleanStreakDays = 0;
    // Only calculate clean streak if the tracker has logged activity or was created on a known date
    const trackerLogs = logs.filter((l) => l.trackerId === tracker.id);
    if (trackerLogs.length > 0) {
      let checkDay = 0;
      while (checkDay < 30) {
        const dStr = getDaysAgo(checkDay);
        const dayMins = trackerLogs
          .filter((l) => l.date === dStr)
          .reduce((sum, l) => sum + l.durationMinutes, 0);

        if (dayMins <= tracker.dailyLimitMinutes) {
          cleanStreakDays++;
          checkDay++;
        } else {
          break;
        }
      }
    }

    const todayLogs = trackerLogs.filter((l) => l.date === today);
    const todayMinutes = todayLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const isWithinLimitToday = todayMinutes <= tracker.dailyLimitMinutes;

    const weeklyMinutes = trackerLogs
      .filter((l) => past7Days.includes(l.date))
      .reduce((sum, l) => sum + l.durationMinutes, 0);

    return {
      tracker,
      cleanStreakDays,
      todayMinutes,
      todayLogsCount: todayLogs.length,
      isWithinLimitToday,
      weeklyMinutes,
    };
  });

  return {
    totalLoggedMinutesThisWeek: minutesThisWeek,
    totalLoggedMinutesLastWeek: minutesLastWeek,
    percentChangeVsLastWeek,
    setbacksThisMonth,
    daysMeetingGoalThisMonth,
    averageDailyTimeThisMonth,
    improvementVsPreviousMonth,
    bestPerformingWeekLabel,
    triggerDistribution,
    dailyTimeTrends,
    trackerSummaries,
  };
}

// -------------------------------------------------------------
// INTELLIGENT PRODUCTIVITY INSIGHTS GENERATOR
// -------------------------------------------------------------
export function generateProductivityInsights(
  tasks: Task[],
  habits: Habit[],
  trackers: AddictionTracker[],
  logs: AddictionLog[]
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  const taskStats = calculateTaskStats(tasks);
  const habitStats = calculateHabitStats(habits);
  const addictStats = calculateAddictionStats(trackers, logs);

  // 1. Task daily completion insight
  if (taskStats.todayTotal > 0) {
    if (taskStats.todayCompletionRate >= 80) {
      insights.push({
        id: 'ins-task-1',
        type: 'positive',
        category: 'tasks',
        title: 'Outstanding Daily Momentum',
        description: `You have completed ${taskStats.todayCompleted} of ${taskStats.todayTotal} planned tasks today (${taskStats.todayCompletionRate}%).`,
        metric: `${taskStats.todayCompletionRate}%`,
      });
    } else if (taskStats.todayPending > 0) {
      insights.push({
        id: 'ins-task-2',
        type: 'info',
        category: 'tasks',
        title: "Focus on Today's Remaining Tasks",
        description: `You have ${taskStats.todayPending} tasks left to accomplish today. Prioritizing high-impact items early builds momentum.`,
        metric: `${taskStats.todayPending} pending`,
      });
    }
  }

  // 2. Overdue tasks warning
  if (taskStats.overdueTasks > 0) {
    insights.push({
      id: 'ins-task-overdue',
      type: 'warning',
      category: 'tasks',
      title: 'Action Needed on Postponed Tasks',
      description: `You have ${taskStats.overdueTasks} overdue task${taskStats.overdueTasks > 1 ? 's' : ''}. Consider rescheduling them to a realistic date or trimming your scope.`,
      metric: `${taskStats.overdueTasks} overdue`,
    });
  }

  // 3. Peak productivity day (only if user has completed at least 3 tasks to form a genuine pattern)
  if (taskStats.mostProductiveDayName && taskStats.completedTasks >= 3) {
    insights.push({
      id: 'ins-productive-day',
      type: 'positive',
      category: 'tasks',
      title: 'Peak Focus Rhythm',
      description: `Historical data shows you complete the highest volume of tasks on ${taskStats.mostProductiveDayName}. Schedule complex deep work blocks then.`,
      metric: taskStats.mostProductiveDayName,
    });
  }

  // 4. Evening postponement pattern
  const eveningTasks = tasks.filter((t) => t.startTime && parseInt(t.startTime.split(':')[0], 10) >= 20);
  const eveningUnfinished = eveningTasks.filter((t) => !t.completed).length;
  if (eveningTasks.length >= 2 && eveningUnfinished > 0) {
    insights.push({
      id: 'ins-evening-drift',
      type: 'warning',
      category: 'tasks',
      title: 'Evening Fatigue Pattern',
      description: 'You frequently postpone tasks scheduled after 8:00 PM. Shift intensive cognitive work to morning or mid-afternoon intervals.',
      metric: 'Evening drift',
    });
  }

  // 5. Habit streak milestone
  if (habitStats.activeStreakHabit && habitStats.activeStreakHabit.streak >= 3) {
    insights.push({
      id: 'ins-habit-streak',
      type: 'milestone',
      category: 'habits',
      title: 'Habit Anchor Established',
      description: `You have maintained your "${habitStats.activeStreakHabit.name}" habit for ${habitStats.activeStreakHabit.streak} consecutive days!`,
      metric: `${habitStats.activeStreakHabit.streak} days`,
    });
  }

  // 6. Overall habit consistency (only if user has active habits with at least 5 logged check-ins)
  if (habitStats.totalHabits > 0 && typeof habitStats.overallConsistency === 'number') {
    const totalCompletions = habits.reduce(
      (sum, h) => sum + Object.keys(h.completions || {}).length,
      0
    );
    if (totalCompletions >= 5) {
      insights.push({
        id: 'ins-habit-consistency',
        type: habitStats.overallConsistency >= 75 ? 'positive' : 'info',
        category: 'habits',
        title: 'Routine Consistency',
        description: `Your combined habit consistency across active positive routines is ${habitStats.overallConsistency}%.`,
        metric: `${habitStats.overallConsistency}%`,
      });
    }
  }

  // 7. Addiction & screen time reduction trend (only if real comparison exists)
  if (addictStats.percentChangeVsLastWeek !== null) {
    if (addictStats.percentChangeVsLastWeek < 0) {
      insights.push({
        id: 'ins-addict-improvement',
        type: 'positive',
        category: 'addiction',
        title: 'Digital Wellness Improving',
        description: `Your screen time decreased by ${Math.abs(addictStats.percentChangeVsLastWeek)}% compared to last week. You are reclaiming valuable focus time.`,
        metric: `-${Math.abs(addictStats.percentChangeVsLastWeek)}%`,
      });
    } else if (addictStats.percentChangeVsLastWeek > 0) {
      insights.push({
        id: 'ins-addict-attention',
        type: 'warning',
        category: 'addiction',
        title: 'Distraction Time Spike',
        description: `Time spent on monitored distractions increased by ${addictStats.percentChangeVsLastWeek}% this week. Check your recorded triggers to regain control.`,
        metric: `+${addictStats.percentChangeVsLastWeek}%`,
      });
    }
  }

  // 8. Primary trigger insight
  if (addictStats.triggerDistribution.length > 0) {
    const topTrigger = addictStats.triggerDistribution[0];
    if (topTrigger.count >= 2) {
      insights.push({
        id: 'ins-trigger',
        type: 'info',
        category: 'addiction',
        title: 'Primary Behavioral Trigger',
        description: `"${topTrigger.trigger}" is your most frequent behavioral trigger (${topTrigger.count} checks, ${topTrigger.minutes} mins). When you notice this emotion, pause and take a short recovery break.`,
        metric: topTrigger.trigger,
      });
    }
  }

  return insights;
}
