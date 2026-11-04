import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { AddictionTracker } from '../types';

interface TrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trackerData: Omit<AddictionTracker, 'id' | 'createdAt'>) => void;
}

export const TrackerModal: React.FC<TrackerModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(25);
  const [reductionGoal, setReductionGoal] = useState('Under 25 mins daily');
  const [color, setColor] = useState<'rose' | 'yellow' | 'lavender' | 'blue' | 'sage'>('rose');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      dailyLimitMinutes: Number(dailyLimitMinutes) || 0,
      reductionGoal: reductionGoal.trim() || 'Gradual reduction',
      color,
      icon: 'Shield',
    });
    onClose();
    setName('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-soft-lg border border-app-border">
        <div className="flex items-center justify-between pb-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pastel-roseLight text-pastel-rose">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-app-text">Monitor Unwanted Habit</h2>
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
              Habit / Behavior to Limit *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Doomscrolling, Late-night screen time, Gaming binge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Context or Boundaries
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Only permitted after 8 PM, or max 20 minutes with timer."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Daily Limit (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={600}
                value={dailyLimitMinutes}
                onChange={(e) => setDailyLimitMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Use 0 if aiming for total cessation.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Reduction Goal
              </label>
              <input
                type="text"
                value={reductionGoal}
                onChange={(e) => setReductionGoal(e.target.value)}
                placeholder="e.g. Under 20m / day"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-app-muted hover:text-app-text rounded-xl border border-app-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-stone-800 hover:bg-stone-900 rounded-xl shadow-soft"
            >
              Add Tracker
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
