import React, { useState } from 'react';
import { X, HeartHandshake, Compass } from 'lucide-react';
import { AddictionTracker, AddictionTrigger, AddictionLog } from '../types';
import { getTodayString } from '../utils/dateUtils';

interface LogAddictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackers: AddictionTracker[];
  defaultTrackerId?: string;
  onSave: (log: Omit<AddictionLog, 'id' | 'timestamp'>) => void;
}

const TRIGGERS: { key: AddictionTrigger; label: string; hint: string }[] = [
  { key: 'boredom', label: 'Boredom', hint: 'Looking for fast stimulation' },
  { key: 'stress', label: 'Stress', hint: 'Escaping pressure or anxiety' },
  { key: 'procrastination', label: 'Procrastination', hint: 'Avoiding an intimidating task' },
  { key: 'fatigue', label: 'Tired / Low Energy', hint: 'Brain needed recovery' },
  { key: 'loneliness', label: 'Loneliness', hint: 'Seeking social connection' },
  { key: 'habit', label: 'Automatic Reflex', hint: 'Muscle memory phone pickup' },
  { key: 'other', label: 'Other Context', hint: 'Specific circumstance' },
];

export const LogAddictionModal: React.FC<LogAddictionModalProps> = ({
  isOpen,
  onClose,
  trackers,
  defaultTrackerId,
  onSave,
}) => {
  const [trackerId, setTrackerId] = useState(defaultTrackerId || trackers[0]?.id || '');
  const [date, setDate] = useState(getTodayString());
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [trigger, setTrigger] = useState<AddictionTrigger>('boredom');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerId) return;

    onSave({
      trackerId,
      date,
      durationMinutes: Number(durationMinutes) || 0,
      trigger,
      note: note.trim() || undefined,
    });
    onClose();
    setNote('');
  };

  const selectedTracker = trackers.find((t) => t.id === trackerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-soft-lg border border-app-border">
        <div className="flex items-center justify-between pb-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pastel-blueLight text-pastel-blue">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-app-text">Log Mindful Check-in</h2>
              <p className="text-xs text-stone-500">
                Setbacks are valuable data points, not failures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-app-muted hover:text-app-text rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Habit / Behavior
            </label>
            <select
              value={trackerId}
              onChange={(e) => setTrackerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl font-medium"
            >
              {trackers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Daily limit: {t.dailyLimitMinutes}m)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Time Spent (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={600}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
            </div>
          </div>

          {/* Trigger identification */}
          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-2">
              What triggered this urge?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRIGGERS.map((item) => {
                const isSelected = trigger === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTrigger(item.key)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-pastel-blueLight border-pastel-blue text-sky-900 font-semibold'
                        : 'border-app-border hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                      {item.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Reflection & Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What can you adjust next time you feel this trigger?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-app-border">
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-stone-400" />
              Progress is iterative, not linear.
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-app-muted hover:text-app-text rounded-xl border border-app-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl shadow-soft"
              >
                Log Check-in
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
