import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Flame,
  TrendingDown,
  HeartHandshake,
  Compass,
  Award,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AddictionTracker } from '../types';
import { getTodayString, formatFriendlyDate } from '../utils/dateUtils';
import { calculateAddictionStats } from '../utils/analyticsEngine';
import { LogAddictionModal } from '../components/LogAddictionModal';
import { TrackerModal } from '../components/TrackerModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AddictionTrackerView: React.FC = () => {
  const {
    addictionTrackers,
    addictionLogs,
    addTracker,
    deleteTracker,
    logAddictionEntry,
    deleteAddictionLog,
  } = useApp();

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);
  const [selectedTrackerIdForLog, setSelectedTrackerIdForLog] = useState<string | undefined>();
  const [trackerToDelete, setTrackerToDelete] = useState<AddictionTracker | null>(null);

  const today = getTodayString();
  const stats = calculateAddictionStats(addictionTrackers, addictionLogs);

  const handleOpenLogModal = (trackerId?: string) => {
    setSelectedTrackerIdForLog(trackerId);
    setLogModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
            <Compass className="w-3.5 h-3.5 text-pastel-rose" />
            <span>Habits & Self Control</span>
          </div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">
            Mindful Self-Control & Addiction Tracker
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Identify emotional triggers, reduce unwanted habits, and reclaim focus without guilt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTrackerModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-app-border rounded-xl shadow-soft transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Tracker</span>
          </button>

          {addictionTrackers.length > 0 && (
            <button
              onClick={() => handleOpenLogModal()}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-soft transition flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Log Check-in</span>
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED REQUIRED INSIGHT CARD: "Your progress this month" */}
      <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 sm:p-6 transition hover:shadow-soft-md">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pastel-blueLight text-sky-900 border border-pastel-blueBorder">
              <Award className="w-5 h-5 text-pastel-blue" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Monthly Self-Control Report
              </span>
              <h2 className="text-lg font-bold text-app-text">Your progress this month</h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-stone-50 border border-stone-200 rounded-full text-xs font-medium text-stone-600">
            <HeartHandshake className="w-3.5 h-3.5 text-pastel-sage" />
            <span>Non-judgmental feedback</span>
          </div>
        </div>

        {/* 5 Required Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-5">
          {/* 1. Total days successfully meeting goal */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-app-border">
            <span className="text-[11px] font-medium text-stone-500">Days Meeting Goal</span>
            <div className="mt-2 text-2xl font-bold text-emerald-800">
              {stats.daysMeetingGoalThisMonth !== null ? `${stats.daysMeetingGoalThisMonth}` : '—'}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              {stats.daysMeetingGoalThisMonth !== null ? 'out of 30 days' : 'Not enough data yet'}
            </span>
          </div>

          {/* 2. Number of setbacks */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-app-border">
            <span className="text-[11px] font-medium text-stone-500">Recorded Setbacks</span>
            <div className="mt-2 text-2xl font-bold text-stone-700">
              {stats.setbacksThisMonth}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">Data points for reflection</span>
          </div>

          {/* 3. Average daily time */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-app-border">
            <span className="text-[11px] font-medium text-stone-500">Avg Daily Time</span>
            <div className="mt-2 text-2xl font-bold text-app-text">
              {stats.averageDailyTimeThisMonth !== null ? `${stats.averageDailyTimeThisMonth}m` : '—'}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              {stats.averageDailyTimeThisMonth !== null ? 'Across recorded days' : 'Not enough data yet'}
            </span>
          </div>

          {/* 4. Improvement compared with previous month */}
          <div className="p-3.5 rounded-xl bg-stone-50/70 border border-app-border">
            <span className="text-[11px] font-medium text-stone-500">vs Last Month</span>
            <div className="mt-2 flex items-center gap-1 text-2xl font-bold text-emerald-800">
              {stats.improvementVsPreviousMonth !== null ? (
                <>
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                  <span>{stats.improvementVsPreviousMonth}%</span>
                </>
              ) : (
                <span className="text-base font-semibold text-stone-400">Not enough data yet</span>
              )}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              {stats.improvementVsPreviousMonth !== null ? 'Reduction in distraction' : 'Requires prior period logs'}
            </span>
          </div>

          {/* 5. Best performing week */}
          <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-stone-50/70 border border-app-border">
            <span className="text-[11px] font-medium text-stone-500">Best Week</span>
            <div className="mt-2 text-sm font-bold text-app-text truncate">
              {stats.bestPerformingWeekLabel || 'Not enough data yet'}
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              {stats.bestPerformingWeekLabel ? 'Highest clean adherence' : 'Tracking in progress'}
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-pastel-sageLight/40 border border-pastel-sageBorder/50 rounded-xl text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-800">Growth Note:</strong> "A setback does not erase your
          cumulative progress. Presenting setbacks as useful reflection data helps identify the emotional triggers behind impulsive loops."
        </div>
      </div>

      {/* Empty State when no trackers exist */}
      {addictionTrackers.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-app-border shadow-soft">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-pastel-roseLight/60 border border-pastel-roseBorder flex items-center justify-center text-rose-600 mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-app-text">
            Start your self-control journey by adding a habit you want to reduce
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            Monitor activities such as doomscrolling, late-night screen time, excessive social media, or procrastination with clear daily boundaries.
          </p>
          <button
            onClick={() => setTrackerModalOpen(true)}
            className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-soft transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add your first tracker</span>
          </button>
        </div>
      ) : (
        /* Active Trackers Grid */
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-app-text">Monitored Behaviors & Clean Streaks</h2>
            <span className="text-xs text-stone-400">
              {addictionTrackers.length} active {addictionTrackers.length === 1 ? 'boundary' : 'boundaries'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.trackerSummaries.map(({ tracker, cleanStreakDays, todayMinutes, isWithinLimitToday, weeklyMinutes }) => {
              const limit = tracker.dailyLimitMinutes;
              const percentOfLimit = limit > 0 ? Math.min(100, Math.round((todayMinutes / limit) * 100)) : (todayMinutes > 0 ? 100 : 0);

              return (
                <div
                  key={tracker.id}
                  className="bg-white rounded-2xl border border-app-border p-5 shadow-soft hover:shadow-soft-md transition space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-pastel-roseLight text-pastel-rose border border-pastel-roseBorder">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-app-text">{tracker.name}</h3>
                        <p className="text-xs text-stone-400">Goal: {tracker.reductionGoal}</p>
                      </div>
                    </div>

                    {/* Clean Streak Badge */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-600">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                        <span>{cleanStreakDays}d clean</span>
                      </div>
                      <span className="text-[10px] text-stone-400">Within goal limit</span>
                    </div>
                  </div>

                  {/* Today's Usage Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Today: {todayMinutes} mins</span>
                      <span className="text-stone-400">Limit: {limit} mins</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isWithinLimitToday ? 'bg-pastel-sage' : 'bg-rose-500'
                        }`}
                        style={{ width: `${percentOfLimit}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className="text-[11px] text-stone-400">
                      Past 7 days: {weeklyMinutes}m total
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenLogModal(tracker.id)}
                        className="px-3 py-1 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-lg border border-app-border transition"
                      >
                        + Log Time
                      </button>
                      <button
                        onClick={() => setTrackerToDelete(tracker)}
                        className="p-1 text-stone-300 hover:text-rose-500 transition"
                        title="Delete tracker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 14-Day Time Trend Chart */}
      <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-app-text">14-Day Distraction Time Trend</h2>
            <p className="text-xs text-stone-400">
              Total minutes logged daily across all monitored habits.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-stone-500">
              <span className="w-2.5 h-2.5 rounded-full bg-pastel-blue" /> Actual Minutes
            </span>
          </div>
        </div>

        {addictionLogs.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-stone-400 text-center">
            Log your first check-in to visualize distraction trends over time.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyTimeTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82A8D1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#82A8D1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #EBEAE5',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#82A8D1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#timeGrad)"
                  name="Minutes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Behavioral Triggers Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trigger Distribution */}
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold text-app-text">Identified Triggers</h3>
            <p className="text-xs text-stone-400">
              Emotional states associated with unwanted pickups or drift.
            </p>
          </div>

          {stats.triggerDistribution.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No triggers recorded yet. Check-ins will map your emotional habits here.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.triggerDistribution.map((t) => {
                const maxMinutes = Math.max(...stats.triggerDistribution.map((item) => item.minutes), 1);
                const percent = Math.round((t.minutes / maxMinutes) * 100);

                return (
                  <div key={t.trigger} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-app-text">{t.trigger}</span>
                      <span className="text-stone-400">
                        {t.count} {t.count === 1 ? 'check' : 'checks'} ({t.minutes} mins)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-pastel-blue h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Mindful Logs */}
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold text-app-text">Recent Reflections</h3>
              <p className="text-xs text-stone-400">Last logged occurrences</p>
            </div>
            {addictionTrackers.length > 0 && (
              <button
                onClick={() => handleOpenLogModal()}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                + Log
              </button>
            )}
          </div>

          {addictionLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No reflections logged yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {addictionLogs.slice(0, 5).map((log) => {
                const tracker = addictionTrackers.find((t) => t.id === log.trackerId);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-app-border bg-stone-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-app-text">
                          {tracker?.name || 'Habit Check-in'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 capitalize">
                          {log.trigger}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-stone-500 text-[11px] mt-1 italic">"{log.note}"</p>
                      )}
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {formatFriendlyDate(log.date)} • {log.durationMinutes} mins
                      </span>
                    </div>

                    <button
                      onClick={() => deleteAddictionLog(log.id)}
                      className="text-stone-300 hover:text-rose-500 p-1"
                      title="Remove log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LogAddictionModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        trackers={addictionTrackers}
        defaultTrackerId={selectedTrackerIdForLog}
        onSave={(data) => logAddictionEntry(data)}
      />

      <TrackerModal
        isOpen={trackerModalOpen}
        onClose={() => setTrackerModalOpen(false)}
        onSave={(data) => addTracker(data)}
      />

      <ConfirmationModal
        isOpen={!!trackerToDelete}
        title="Delete Tracker"
        message={`Are you sure you want to delete "${trackerToDelete?.name}"? All associated log entries will also be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (trackerToDelete) deleteTracker(trackerToDelete.id);
          setTrackerToDelete(null);
        }}
        onCancel={() => setTrackerToDelete(null)}
      />
    </div>
  );
};
