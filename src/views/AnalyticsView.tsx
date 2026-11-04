import React from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  calculateTaskStats,
  calculateHabitStats,
  calculateAddictionStats,
  generateProductivityInsights,
} from '../utils/analyticsEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { tasks, habits, addictionTrackers, addictionLogs } = useApp();

  const taskStats = calculateTaskStats(tasks);
  const habitStats = calculateHabitStats(habits);
  const addictStats = calculateAddictionStats(addictionTrackers, addictionLogs);
  const insights = generateProductivityInsights(tasks, habits, addictionTrackers, addictionLogs);

  // Donut chart data: Pending vs Completed
  const pendingVsCompletedData = [
    { name: 'Completed', value: taskStats.completedTasks, color: '#94B49F' },
    { name: 'Pending', value: taskStats.pendingTasks, color: '#EBEAE5' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          <BarChart3 className="w-3.5 h-3.5 text-pastel-sage" />
          <span>Productivity Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-app-text tracking-tight">Analytics & Dynamic Insights</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Real-time analysis derived strictly from your stored tasks, habits, and self-control check-ins.
        </p>
      </div>

      {/* SECTION 1: DYNAMIC PRODUCTIVITY INSIGHTS */}
      <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pastel-yellowLight text-amber-700">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-app-text">Calculated Insights Engine</h2>
              <p className="text-xs text-stone-400">
                Actionable behavioral patterns detected in your activity.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
            {insights.length} Active {insights.length === 1 ? 'Insight' : 'Insights'}
          </span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 text-center bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
            <p className="text-xs text-stone-500 font-medium">
              Your productivity insights will appear as you start using Aura.
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Add tasks and check off routines to uncover peak productivity days, completion momentum, and focus rhythms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {insights.map((ins) => {
              const borderStyles = {
                positive: 'border-pastel-sageBorder bg-pastel-sageLight/20',
                warning: 'border-pastel-roseBorder bg-pastel-roseLight/20',
                info: 'border-pastel-blueBorder bg-pastel-blueLight/20',
                milestone: 'border-pastel-yellowBorder bg-pastel-yellowLight/20',
              };
              const tagStyles = {
                positive: 'text-emerald-800 bg-pastel-sageLight',
                warning: 'text-rose-800 bg-pastel-roseLight',
                info: 'text-sky-800 bg-pastel-blueLight',
                milestone: 'text-amber-800 bg-pastel-yellowLight',
              };

              return (
                <div
                  key={ins.id}
                  className={`p-4 rounded-xl border ${borderStyles[ins.type]} space-y-2 transition hover:shadow-soft`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-app-text">{ins.title}</span>
                    {ins.metric && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagStyles[ins.type]}`}
                      >
                        {ins.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{ins.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TASK ANALYTICS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-pastel-sage" />
          <h2 className="text-lg font-bold text-app-text">Task Performance Analytics</h2>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Completion Percentage</span>
            <div className="text-2xl font-bold text-app-text mt-2">
              {taskStats.totalTasks > 0 ? `${taskStats.completionRate}%` : '—'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {taskStats.totalTasks > 0
                ? `${taskStats.completedTasks} of ${taskStats.totalTasks} total tasks`
                : 'No tasks created yet'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Most Productive Day</span>
            <div className="text-2xl font-bold text-app-text mt-2 truncate">
              {taskStats.mostProductiveDayName || 'Not enough data yet'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {taskStats.mostProductiveDayName
                ? 'Highest completion velocity'
                : 'Complete tasks to evaluate'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Avg Completion / Duration</span>
            <div className="text-2xl font-bold text-app-text mt-2">
              {taskStats.avgDurationMinutes > 0 ? `${taskStats.avgDurationMinutes}m` : '—'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {taskStats.avgDurationMinutes > 0
                ? 'Estimated effort per task'
                : 'No durations set'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">On-Time Completion</span>
            <div className="text-2xl font-bold text-emerald-800 mt-2">
              {taskStats.completedTasks > 0
                ? `${Math.round((taskStats.onTimeCompletions / taskStats.completedTasks) * 100)}%`
                : '—'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {taskStats.completedTasks > 0
                ? `${taskStats.onTimeCompletions} tasks finished on or before date`
                : 'Not enough data yet'}
            </span>
          </div>
        </div>

        {/* Charts: Daily Completion History & Donut Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily tasks completed per day bar chart (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-app-text">Daily Tasks Completed (Last 7 Days)</h3>
                <p className="text-xs text-stone-400">Total volume completed per day</p>
              </div>
            </div>

            {taskStats.completedTasks === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-stone-400 text-center">
                Complete tasks to see daily output trends across the week.
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taskStats.dailyCompletionHistory}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #EBEAE5',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="completed" fill="#94B49F" radius={[6, 6, 0, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pending vs Completed Donut (1 col) */}
          <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4 flex flex-col justify-between">
            <div className="pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-app-text">Workload Status</h3>
              <p className="text-xs text-stone-400">Pending vs Completed tasks</p>
            </div>

            {taskStats.totalTasks === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-stone-400 text-center">
                No tasks logged yet.
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pendingVsCompletedData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pendingVsCompletedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pastel-sage" /> Completed
                </span>
                <span className="font-semibold text-app-text">{taskStats.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Pending
                </span>
                <span className="font-semibold text-app-text">{taskStats.pendingTasks}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: HABIT & SELF-CONTROL ANALYTICS */}
      <div className="space-y-4 pt-4 border-t border-app-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pastel-lavender" />
          <h2 className="text-lg font-bold text-app-text">Habit & Self-Control Analytics</h2>
        </div>

        {/* Habit stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Positive Habit Consistency</span>
            <div className="text-2xl font-bold text-app-text mt-2">
              {habitStats.overallConsistency !== null ? `${habitStats.overallConsistency}%` : 'Not enough data yet'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {habitStats.overallConsistency !== null ? '30-day streak adherence' : 'No habits tracked'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Bad Habit Reduction</span>
            <div className="text-2xl font-bold text-emerald-800 mt-2">
              {addictStats.percentChangeVsLastWeek !== null ? (
                addictStats.percentChangeVsLastWeek < 0 ? (
                  `-${Math.abs(addictStats.percentChangeVsLastWeek)}%`
                ) : (
                  `+${addictStats.percentChangeVsLastWeek}%`
                )
              ) : (
                <span className="text-base font-semibold text-stone-400">Not enough data yet</span>
              )}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {addictStats.percentChangeVsLastWeek !== null
                ? addictStats.percentChangeVsLastWeek <= 0
                  ? 'Time decreased vs last week'
                  : 'Distraction time increased'
                : 'Requires prior week records'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Avg Daily Distraction Time</span>
            <div className="text-2xl font-bold text-app-text mt-2">
              {addictStats.averageDailyTimeThisMonth !== null
                ? `${addictStats.averageDailyTimeThisMonth}m`
                : 'Not enough data yet'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {addictStats.averageDailyTimeThisMonth !== null ? 'Across logged check-ins' : 'No logs recorded'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-app-border shadow-soft">
            <span className="text-xs text-stone-500 font-medium">Days Meeting Limit</span>
            <div className="text-2xl font-bold text-emerald-800 mt-2">
              {addictStats.daysMeetingGoalThisMonth !== null
                ? `${addictStats.daysMeetingGoalThisMonth} / 30`
                : 'Not enough data yet'}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              {addictStats.daysMeetingGoalThisMonth !== null ? 'Discipline goal met' : 'No active trackers'}
            </span>
          </div>
        </div>

        {/* Weekly Completion Trends chart */}
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-app-text">Weekly Habit Check-in Frequency</h3>
              <p className="text-xs text-stone-400">Total positive habits fulfilled per day</p>
            </div>
          </div>

          {habits.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-stone-400 text-center">
              Add positive habits to track daily fulfillment frequency.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={habitStats.weeklyCompletionTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #EBEAE5',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="completions" fill="#B8A8D8" radius={[6, 6, 0, 0]} name="Habits Done" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
