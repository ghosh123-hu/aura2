import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Trophy,
  Check,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Habit } from '../types';
import { getTodayString, getPastNDays } from '../utils/dateUtils';
import { calculateHabitStats } from '../utils/analyticsEngine';
import { HabitModal } from '../components/HabitModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { format, parseISO } from 'date-fns';

export const HabitsView: React.FC = () => {
  const { habits, addHabit, toggleHabitDay, deleteHabit } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const today = getTodayString();
  const habitStats = calculateHabitStats(habits);

  const heatmapDays = getPastNDays(28);

  const habitColorStyles: Record<string, { bg: string; text: string; fill: string; border: string }> = {
    sage: {
      bg: 'bg-pastel-sageLight',
      text: 'text-emerald-900',
      fill: 'bg-pastel-sage',
      border: 'border-pastel-sageBorder',
    },
    blue: {
      bg: 'bg-pastel-blueLight',
      text: 'text-sky-900',
      fill: 'bg-pastel-blue',
      border: 'border-pastel-blueBorder',
    },
    lavender: {
      bg: 'bg-pastel-lavenderLight',
      text: 'text-purple-900',
      fill: 'bg-pastel-lavender',
      border: 'border-pastel-lavenderBorder',
    },
    yellow: {
      bg: 'bg-pastel-yellowLight',
      text: 'text-amber-900',
      fill: 'bg-pastel-yellow',
      border: 'border-pastel-yellowBorder',
    },
    rose: {
      bg: 'bg-pastel-roseLight',
      text: 'text-rose-900',
      fill: 'bg-pastel-rose',
      border: 'border-pastel-roseBorder',
    },
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-pastel-sage" />
            <span>Habits & Self Control</span>
          </div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Positive Routines</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Compound small daily habits into lasting personal growth.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-pastel-sageLight hover:bg-[#DDE9DC] text-stone-900 border border-pastel-sageBorder text-xs sm:text-sm font-semibold rounded-xl shadow-soft transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits High-Level Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-stone-500">Overall Consistency</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-app-text">
              {habitStats.overallConsistency !== null ? `${habitStats.overallConsistency}%` : '—'}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 mt-2">
            {habits.length > 0 ? 'Past 30-day average' : 'No habits added yet'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-stone-500">Active Habits</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-app-text">{habits.length}</span>
            <span className="text-xs text-stone-400">routines</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-2">Daily & weekday habits</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-stone-500">Current Best Streak</span>
          <div className="mt-3 flex items-baseline gap-2">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            <span className="text-2xl font-bold text-app-text">
              {habitStats.activeStreakHabit?.streak || 0}
            </span>
            <span className="text-xs text-stone-400">days</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-2 truncate">
            {habitStats.activeStreakHabit?.name || 'Start tracking check-ins'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft flex flex-col justify-between">
          <span className="text-xs font-medium text-stone-500">All-Time Longest</span>
          <div className="mt-3 flex items-baseline gap-2">
            <Trophy className="w-5 h-5 text-pastel-yellow" />
            <span className="text-2xl font-bold text-app-text">
              {habitStats.longestStreakHabit?.streak || 0}
            </span>
            <span className="text-xs text-stone-400">days</span>
          </div>
          <span className="text-[11px] text-stone-400 mt-2 truncate">
            {habitStats.longestStreakHabit?.name || 'Personal record'}
          </span>
        </div>
      </div>

      {/* Section 1: Today's Habit Checklist & Week View */}
      {habits.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-app-border shadow-soft">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-sageLight/50 border border-pastel-sageBorder flex items-center justify-center text-pastel-sage mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-app-text">No habits added yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Start building a routine. Track reading, exercise, meditation, or hydration to anchor your focus.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 bg-pastel-sageLight hover:bg-[#DDE9DC] text-stone-900 border border-pastel-sageBorder text-xs font-semibold rounded-xl shadow-soft transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create your first habit</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-app-text">Daily Habit Checklist</h2>
              <p className="text-xs text-stone-400">
                Check off your practices for today, or toggle any of the past 7 days.
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pastel-sageLight text-emerald-800 border border-pastel-sageBorder">
              {habitStats.habitPerformanceList.filter((h) => h.completedToday).length} of{' '}
              {habits.length} Done Today
            </span>
          </div>

          {/* Habit Rows */}
          <div className="divide-y divide-stone-100">
            {habitStats.habitPerformanceList.map((item) => {
              const h = item.habit;
              const style = habitColorStyles[h.color] || habitColorStyles.sage;

              return (
                <div
                  key={h.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Today Toggle Button */}
                    <button
                      onClick={() => toggleHabitDay(h.id, today)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        item.completedToday
                          ? 'bg-pastel-sage border-pastel-sage text-white'
                          : 'border-stone-300 hover:border-stone-500 bg-white'
                      }`}
                      title={item.completedToday ? 'Mark incomplete' : 'Mark done for today'}
                    >
                      {item.completedToday && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            item.completedToday ? 'line-through text-stone-400' : 'text-app-text'
                          }`}
                        >
                          {h.title}
                        </h4>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {h.category}
                        </span>
                      </div>
                      {h.description && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{h.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Past 7 days clickable bubbles */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {item.weeklyProgress.map((w) => (
                        <button
                          key={w.date}
                          onClick={() => toggleHabitDay(h.id, w.date)}
                          title={`${format(parseISO(w.date), 'EEE, MMM d')}: ${
                            w.completed ? 'Completed' : 'Pending'
                          }`}
                          className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center transition ${
                            w.completed
                              ? 'bg-pastel-sage text-white shadow-soft-sm'
                              : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          {w.day}
                        </button>
                      ))}
                    </div>

                    {/* Streak & Consistency */}
                    <div className="text-right min-w-[70px]">
                      <div className="text-xs font-bold text-app-text flex items-center justify-end gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{item.currentStreak}d</span>
                      </div>
                      <div className="text-[10px] text-stone-400">{item.completionRate30Days}%</div>
                    </div>

                    {/* Delete habit */}
                    <button
                      onClick={() => setHabitToDelete(h)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 transition"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Consistency Heatmap (Notion / GitHub style) */}
      {habits.length > 0 && (
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-app-text">Consistency Heatmap</h2>
              <p className="text-xs text-stone-400">
                Visual log of daily positive habit completions over the past 4 weeks.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
              <span>Less</span>
              <div className="w-3 h-3 rounded bg-stone-100" />
              <div className="w-3 h-3 rounded bg-[#CDE0D2]" />
              <div className="w-3 h-3 rounded bg-pastel-sage" />
              <div className="w-3 h-3 rounded bg-emerald-700" />
              <span>More</span>
            </div>
          </div>

          {/* Heatmap Matrix */}
          <div className="overflow-x-auto py-2">
            <div className="space-y-3 min-w-[500px]">
              {habits.map((habit) => {
                return (
                  <div key={habit.id} className="flex items-center gap-3">
                    <div className="w-36 text-xs font-semibold text-app-text truncate">
                      {habit.title}
                    </div>
                    <div className="flex-1 flex items-center gap-1.5">
                      {heatmapDays.map((dateStr) => {
                        const count = habit.completions[dateStr] || 0;
                        const isDone = count >= (habit.targetCount || 1);

                        let cellBg = 'bg-stone-100 hover:ring-1 hover:ring-stone-400';
                        if (isDone) cellBg = 'bg-pastel-sage hover:bg-emerald-600';

                        return (
                          <div
                            key={dateStr}
                            title={`${habit.title} on ${format(parseISO(dateStr), 'MMM d')}: ${
                              isDone ? 'Done' : 'Not logged'
                            }`}
                            className={`w-4 h-4 rounded-sm transition-colors cursor-pointer ${cellBg}`}
                            onClick={() => toggleHabitDay(habit.id, dateStr)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding habit */}
      <HabitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data) => addHabit(data)}
      />

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={!!habitToDelete}
        title="Delete Habit"
        message={`Are you sure you want to delete the habit "${habitToDelete?.title}"? Its logged completion history will be removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (habitToDelete) deleteHabit(habitToDelete.id);
          setHabitToDelete(null);
        }}
        onCancel={() => setHabitToDelete(null)}
      />
    </div>
  );
};
