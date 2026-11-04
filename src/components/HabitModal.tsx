import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Habit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void;
}

const CATEGORIES = ['Health', 'Mindfulness', 'Learning', 'Productivity', 'Fitness', 'Personal'];
const COLORS: ('sage' | 'blue' | 'lavender' | 'yellow' | 'rose')[] = [
  'sage',
  'blue',
  'lavender',
  'yellow',
  'rose',
];

export const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Learning');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [targetCount, setTargetCount] = useState(1);
  const [unit, setUnit] = useState('session');
  const [color, setColor] = useState<'sage' | 'blue' | 'lavender' | 'yellow' | 'rose'>('sage');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      targetCount: Number(targetCount) || 1,
      unit,
      color,
      icon: 'CheckCircle',
    });
    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-soft-lg border border-app-border">
        <div className="flex items-center justify-between pb-4 border-b border-app-border">
          <h2 className="text-base font-semibold text-app-text">Build Positive Habit</h2>
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
              Habit Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 20-min Morning Reading, 8 Glasses of Water, 15m Meditation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Purpose & Intention
            </label>
            <textarea
              rows={2}
              placeholder="Why is this routine meaningful to your long-term identity?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl capitalize"
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays Only (Mon-Fri)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Target Per Day
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
                Unit (e.g. pages, workout, glasses)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="session, glasses, pages"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-2">
              Color Accent
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => {
                const colorBg = {
                  sage: 'bg-pastel-sageLight border-pastel-sage text-emerald-800',
                  blue: 'bg-pastel-blueLight border-pastel-blue text-sky-800',
                  lavender: 'bg-pastel-lavenderLight border-pastel-lavender text-purple-900',
                  yellow: 'bg-pastel-yellowLight border-pastel-yellow text-amber-900',
                  rose: 'bg-pastel-roseLight border-pastel-rose text-rose-900',
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl border capitalize transition ${
                      color === c ? `${colorBg[c]} ring-2 ring-stone-400` : 'border-app-border text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
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
              className="px-5 py-2 text-sm font-semibold text-stone-900 bg-pastel-sageLight hover:bg-[#DDE9DC] border border-pastel-sageBorder rounded-xl shadow-soft"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
