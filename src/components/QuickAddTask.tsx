import React, { useState } from 'react';
import { Plus, Clock, Calendar, Flag, Sparkles, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Priority, TaskCategory } from '../types';
import { getTodayString, getDaysAhead } from '../utils/dateUtils';

interface QuickAddTaskProps {
  defaultDate?: string;
  placeholder?: string;
  onOpenFullModal?: () => void;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  defaultDate,
  placeholder = 'Quick add: "Study DBMS for 2 hours tomorrow at 5 PM" or type title...',
  onOpenFullModal,
}) => {
  const { addTask } = useApp();
  const [inputVal, setInputVal] = useState('');
  const [selectedDate, setSelectedDate] = useState(defaultDate || getTodayString());
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('Work');
  const [selectedDuration, setSelectedDuration] = useState<number>(45);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('10:00');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Intelligent parser for quick typing:
  // e.g. "Study DBMS for 2 hours tomorrow at 5 PM"
  const parseNaturalInput = (text: string) => {
    let cleanTitle = text;
    let parsedDate = selectedDate;
    let parsedDuration = selectedDuration;
    let parsedStartTime = selectedStartTime;
    let parsedCategory = selectedCategory;
    let parsedPriority = selectedPriority;

    // Detect "tomorrow"
    if (/\btomorrow\b/i.test(cleanTitle)) {
      parsedDate = getDaysAhead(1);
      cleanTitle = cleanTitle.replace(/\btomorrow\b/i, '').trim();
    } else if (/\btoday\b/i.test(cleanTitle)) {
      parsedDate = getTodayString();
      cleanTitle = cleanTitle.replace(/\btoday\b/i, '').trim();
    }

    // Detect duration: "for 2 hours", "for 1 hour", "for 30 mins", "for 45m"
    const hourMatch = cleanTitle.match(/for\s+(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/i);
    if (hourMatch) {
      parsedDuration = Math.round(parseFloat(hourMatch[1]) * 60);
      cleanTitle = cleanTitle.replace(hourMatch[0], '').trim();
    }
    const minMatch = cleanTitle.match(/for\s+(\d+)\s*(?:minutes|minute|mins|min|m)\b/i);
    if (minMatch) {
      parsedDuration = parseInt(minMatch[1], 10);
      cleanTitle = cleanTitle.replace(minMatch[0], '').trim();
    }

    // Detect time: "at 5 PM", "at 14:00", "at 9:30 AM"
    const timeMatch = cleanTitle.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? timeMatch[2] : '00';
      const ampm = timeMatch[3]?.toLowerCase();
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      parsedStartTime = `${String(h).padStart(2, '0')}:${m}`;
      cleanTitle = cleanTitle.replace(timeMatch[0], '').trim();
    }

    // Detect category keywords
    if (/study|exam|course|class|revision|reading|dsa|dbms/i.test(cleanTitle)) {
      parsedCategory = 'Study';
    } else if (/workout|gym|run|walk|exercise|health|yoga|stretch/i.test(cleanTitle)) {
      parsedCategory = 'Health';
    } else if (/budget|tax|invoice|bill|expense|finance/i.test(cleanTitle)) {
      parsedCategory = 'Finance';
    }

    // Detect priority keywords
    if (/urgent|asap|critical|high priority/i.test(cleanTitle)) {
      parsedPriority = 'high';
      cleanTitle = cleanTitle.replace(/urgent|asap|critical|high priority/gi, '').trim();
    }

    // Clean extra punctuation
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    return {
      title: cleanTitle || text,
      date: parsedDate,
      duration: parsedDuration,
      startTime: parsedStartTime,
      category: parsedCategory,
      priority: parsedPriority,
    };
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const parsed = parseNaturalInput(inputVal);

    addTask({
      title: parsed.title,
      date: parsed.date,
      startTime: parsed.startTime,
      priority: parsed.priority,
      category: parsed.category,
      estimatedDuration: parsed.duration,
      completed: false,
    });

    setInputVal('');
    setIsOptionsOpen(false);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-app-border shadow-soft p-3 sm:p-4 transition hover:border-app-borderHover">
      <form onSubmit={handleQuickSubmit}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-stone-50 rounded-xl border border-app-border focus-within:bg-white focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-400 transition">
            <Plus className="w-4 h-4 text-app-muted flex-shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-app-text placeholder:text-stone-400"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="px-4 py-2.5 bg-pastel-sageLight hover:bg-[#D8E6D7] disabled:opacity-40 disabled:hover:bg-pastel-sageLight text-stone-900 border border-pastel-sageBorder text-xs sm:text-sm font-semibold rounded-xl shadow-soft transition flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              title="Open full task creator"
              className="p-2.5 text-app-muted hover:text-app-text hover:bg-stone-100 rounded-xl border border-app-border transition flex-shrink-0"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick parameters bar */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 text-xs border-t border-stone-100">
          {/* Quick Date pill */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayString())}
              className={`px-2.5 py-1 rounded-lg border transition ${
                selectedDate === getTodayString()
                  ? 'bg-pastel-sageLight border-pastel-sage text-emerald-800 font-medium'
                  : 'bg-stone-50 border-app-border text-app-muted hover:bg-stone-100'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getDaysAhead(1))}
              className={`px-2.5 py-1 rounded-lg border transition ${
                selectedDate === getDaysAhead(1)
                  ? 'bg-pastel-blueLight border-pastel-blue text-sky-800 font-medium'
                  : 'bg-stone-50 border-app-border text-app-muted hover:bg-stone-100'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Priority Quick selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as Priority)}
            className="px-2.5 py-1 bg-stone-50 border border-app-border rounded-lg text-app-muted text-xs capitalize hover:bg-stone-100 cursor-pointer"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          {/* Category quick selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TaskCategory)}
            className="px-2.5 py-1 bg-stone-50 border border-app-border rounded-lg text-app-muted text-xs capitalize hover:bg-stone-100 cursor-pointer"
          >
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Health">Health</option>
            <option value="Personal">Personal</option>
            <option value="Finance">Finance</option>
            <option value="Creative">Creative</option>
          </select>

          {/* Duration quick selector */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="px-2.5 py-1 bg-stone-50 border border-app-border rounded-lg text-app-muted text-xs hover:bg-stone-100 cursor-pointer"
          >
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={45}>45m</option>
            <option value={60}>1h</option>
            <option value={90}>1.5h</option>
            <option value={120}>2h</option>
          </select>

          <span className="hidden md:inline ml-auto text-[11px] text-stone-400">
            Tip: Supports natural phrasing like "tomorrow at 5 PM for 2 hours"
          </span>
        </div>
      </form>
    </div>
  );
};
