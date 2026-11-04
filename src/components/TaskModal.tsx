import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Flag, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Task, Priority, TaskCategory } from '../types';
import { getTodayString, getDaysAhead } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  initialTask?: Task | null;
  defaultDate?: string;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Health', 'Personal', 'Finance', 'Creative'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const pad = (value: number) => String(value).padStart(2, '0');
const clockValue = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
const nextQuarter = () => {
  const now = new Date();
  const next = Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 15) * 15;
  const date = new Date(now);
  if (next >= 1440) { date.setDate(date.getDate() + 1); return { date: format(date, 'yyyy-MM-dd'), minutes: next % 1440 }; }
  return { date: format(date, 'yyyy-MM-dd'), minutes: next };
};
const to12HourParts = (absoluteMinutes: number) => {
  const minute = ((absoluteMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(minute / 60);
  return { hour: hour24 % 12 || 12, minute: minute % 60, period: hour24 >= 12 ? 'PM' : 'AM' };
};
const from12HourParts = (hour: number, minute: number, period: string) => {
  const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
  return hour24 * 60 + minute;
};

const TimePicker: React.FC<{ label: string; value: number; onChange: (value: number) => void; detail?: string }> = ({ label, value, onChange, detail }) => {
  const parts = to12HourParts(value);
  const minuteValues = Array.from(new Set([0, 15, 30, 45, parts.minute])).sort((a, b) => a - b);
  const change = (hour: number, minute: number, period: string) => onChange(from12HourParts(hour, minute, period));
  const selectClass = 'min-w-0 appearance-none bg-transparent text-center text-sm font-semibold text-stone-800 focus:outline-none cursor-pointer';
  return <div className="min-w-0">
    <div className="mb-1.5 flex items-center justify-between gap-2"><label className="text-[11px] font-semibold uppercase tracking-[.08em] text-stone-500">{label}</label>{detail && <span className="text-[10px] font-medium text-stone-400">{detail}</span>}</div>
    <div className="flex h-11 items-center justify-center gap-1 rounded-xl border border-app-border bg-stone-50 px-2 transition focus-within:border-pastel-sage focus-within:bg-white focus-within:ring-2 focus-within:ring-pastel-sageLight">
      <Clock3 className="mr-1 h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
      <span className="relative flex items-center"><select aria-label={`${label} hour`} className={`${selectClass} w-10`} value={parts.hour} onChange={(e) => change(Number(e.target.value), parts.minute, parts.period)}>{Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => <option key={hour} value={hour}>{pad(hour)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-stone-400"/></span>
      <span className="text-sm font-semibold text-stone-400">:</span>
      <span className="relative flex items-center"><select aria-label={`${label} minute`} className={`${selectClass} w-10`} value={parts.minute} onChange={(e) => change(parts.hour, Number(e.target.value), parts.period)}>{minuteValues.map((minute) => <option key={minute} value={minute}>{pad(minute)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-stone-400"/></span>
      <span className="relative ml-1 flex items-center"><select aria-label={`${label} AM or PM`} className={`${selectClass} w-12`} value={parts.period} onChange={(e) => change(parts.hour, parts.minute, e.target.value)}><option>AM</option><option>PM</option></select><ChevronDown className="pointer-events-none absolute right-0 h-3 w-3 text-stone-400"/></span>
    </div>
  </div>;
};

const DatePicker: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  let formatted = 'Choose a date';
  try { if (value) formatted = format(parseISO(value), 'dd MMM yyyy'); } catch { /* Keep the accessible fallback label. */ }
  return <div className="relative">
    <button type="button" onClick={() => { const input = inputRef.current; if (!input) return; if ('showPicker' in input && typeof input.showPicker === 'function') input.showPicker(); else input.focus(); }} className="flex h-11 w-full items-center justify-between rounded-xl border border-app-border bg-stone-50 px-3.5 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-sageLight">
      <span className="flex items-center gap-2.5"><CalendarDays className="h-4 w-4 text-stone-400"/><span className="text-sm font-medium text-stone-800">{formatted}</span></span><ChevronDown className="h-4 w-4 text-stone-400"/>
    </button>
    <input ref={inputRef} aria-label="Scheduled date" type="date" required value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
  </div>;
};

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialTask, defaultDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [startMinutes, setStartMinutes] = useState(0);
  const [duration, setDuration] = useState(45);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<string>('Work');
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    if (initialTask) {
      const startParts = (initialTask.startTime || '09:00').split(':').map(Number);
      const start = (startParts[0] || 0) * 60 + (startParts[1] || 0);
      const taskDuration = Math.max(15, Number(initialTask.estimatedDuration) || 45);
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setDate(initialTask.date);
      setStartMinutes(start);
      setDuration(taskDuration);
      setPriority(initialTask.priority);
      setCategory(initialTask.category);
    } else {
      const next = nextQuarter();
      setTitle(''); setDescription(''); setDate(defaultDate || next.date);
      setStartMinutes(next.minutes); setDuration(45); setPriority('medium'); setCategory('Work');
    }
    setValidationMessage('');
  }, [initialTask, isOpen, defaultDate]);

  if (!isOpen) return null;

  const endMinutes = startMinutes + duration;
  const setStart = (minutes: number) => {
    setStartMinutes(minutes);
    setValidationMessage('');
  };
  const setEnd = (clockMinutes: number) => {
    let absoluteEnd = clockMinutes;
    if (absoluteEnd <= startMinutes) absoluteEnd += 1440;
    const nextDuration = absoluteEnd - startMinutes;
    if (nextDuration > 1440) { setValidationMessage('A scheduled task cannot be longer than 24 hours.'); return; }
    setDuration(nextDuration);
    setValidationMessage('');
  };
  const setEstimatedDuration = (value: number) => {
    if (!Number.isFinite(value) || value < 1 || value > 1440) return;
    setDuration(value);
    setValidationMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setValidationMessage('Add a task title to continue.'); return; }
    if (duration < 1 || duration > 1440 || endMinutes <= startMinutes) { setValidationMessage('Choose an end time after the start time.'); return; }
    const endDate = new Date(`${date}T00:00:00`);
    endDate.setDate(endDate.getDate() + Math.floor(endMinutes / 1440));
    const deadline = endMinutes >= 1440 ? `${format(endDate, 'yyyy-MM-dd')} ${clockValue(endMinutes)}` : clockValue(endMinutes);
    onSave({
      title: title.trim(), description: description.trim() || undefined, date,
      startTime: clockValue(startMinutes), deadline, priority, category,
      estimatedDuration: duration,
      completed: initialTask ? initialTask.completed : false,
      completedAt: initialTask ? initialTask.completedAt : undefined,
      timeSpentMinutes: initialTask?.timeSpentMinutes,
    });
    onClose();
  };

  const priorities: Record<Priority, { text: string; active: string; dot: string }> = {
    low: { text: 'Low', active: 'border-pastel-blue bg-pastel-blueLight text-sky-900', dot: 'bg-sky-400' },
    medium: { text: 'Medium', active: 'border-pastel-yellow bg-pastel-yellowLight text-amber-900', dot: 'bg-amber-400' },
    high: { text: 'High', active: 'border-pastel-rose bg-pastel-roseLight text-rose-900', dot: 'bg-rose-400' },
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="flex max-h-[min(92dvh,780px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-app-border bg-white shadow-soft-lg">
      <header className="flex shrink-0 items-center justify-between border-b border-app-border px-5 py-4 sm:px-7">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-emerald-800">Aura · Task planner</p><h2 id="task-modal-title" className="mt-0.5 text-lg font-semibold tracking-tight text-app-text">{initialTask ? 'Edit task' : 'Create new task'}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close task form" className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-800"><X className="h-4 w-4"/></button>
      </header>

      <form id="task-form" onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-stone-600">Task title <span className="text-rose-500">*</span></span><input type="text" required maxLength={160} placeholder="What needs to get done?" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-xl border border-app-border bg-stone-50 px-3.5 text-sm text-stone-800 placeholder:text-stone-400 transition focus:border-pastel-sage focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-sageLight" autoFocus /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-stone-600">Description <span className="font-normal text-stone-400">· optional</span></span><textarea rows={2} maxLength={1000} placeholder="Add useful details or notes" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-y rounded-xl border border-app-border bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 transition focus:border-pastel-sage focus:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-sageLight"/></label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div><span className="mb-1.5 block text-xs font-semibold text-stone-600">Scheduled date</span><DatePicker value={date} onChange={setDate}/><div className="mt-2 flex gap-1.5"><button type="button" onClick={() => setDate(getTodayString())} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${date === getTodayString() ? 'border-pastel-sageBorder bg-pastel-sageLight text-emerald-900' : 'border-app-border text-stone-500 hover:bg-stone-50'}`}>Today</button><button type="button" onClick={() => setDate(getDaysAhead(1))} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${date === getDaysAhead(1) ? 'border-pastel-blueBorder bg-pastel-blueLight text-sky-900' : 'border-app-border text-stone-500 hover:bg-stone-50'}`}>Tomorrow</button><button type="button" onClick={() => setDate(getDaysAhead(7))} className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${date === getDaysAhead(7) ? 'border-pastel-lavenderBorder bg-pastel-lavenderLight text-purple-900' : 'border-app-border text-stone-500 hover:bg-stone-50'}`}>Next week</button></div></div>
            <div className="sm:w-36"><label htmlFor="task-duration" className="mb-1.5 block text-xs font-semibold text-stone-600">Duration</label><div className="flex h-11 items-center rounded-xl border border-app-border bg-stone-50 px-3 focus-within:border-pastel-sage focus-within:bg-white focus-within:ring-2 focus-within:ring-pastel-sageLight"><input id="task-duration" type="number" min={1} max={1440} step={1} value={duration} onChange={(e) => setEstimatedDuration(Number(e.target.value))} className="w-full bg-transparent text-sm font-semibold tabular-nums outline-none"/><span className="ml-2 text-xs text-stone-400">min</span></div></div>
          </div>

          <div className="rounded-2xl border border-stone-200/80 bg-[#FBFAF7] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between"><div><h3 className="text-xs font-semibold text-stone-700">Schedule</h3><p className="mt-0.5 text-[11px] text-stone-400">Times use 15-minute intervals. End time follows duration.</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-500 shadow-soft-sm">{duration >= 60 ? `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}` : `${duration} min`}</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end"><TimePicker label="Start" value={startMinutes} onChange={setStart}/><div className="hidden h-11 items-center justify-center text-stone-300 sm:flex">→</div><TimePicker label="End" value={endMinutes} detail={endMinutes >= 1440 ? 'Next day' : undefined} onChange={setEnd}/></div>
            {endMinutes >= 1440 && <p className="mt-2 text-[11px] text-stone-400">Ends {format(new Date(`${date}T00:00:00`).setDate(new Date(`${date}T00:00:00`).getDate() + 1), 'dd MMM yyyy')}.</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-[.85fr_1.15fr]">
            <fieldset><legend className="mb-2 text-xs font-semibold text-stone-600">Priority</legend><div className="grid grid-cols-3 gap-1.5">{PRIORITIES.map((item) => <button key={item} type="button" aria-pressed={priority === item} onClick={() => setPriority(item)} className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-medium capitalize transition ${priority === item ? priorities[item].active : 'border-app-border bg-white text-stone-500 hover:bg-stone-50'}`}><span className={`h-1.5 w-1.5 rounded-full ${priority === item ? priorities[item].dot : 'bg-stone-300'}`}/>{priorities[item].text}</button>)}</div></fieldset>
            <fieldset><legend className="mb-2 text-xs font-semibold text-stone-600">Category</legend><div className="flex flex-wrap gap-1.5">{CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-lg border px-2.5 py-2 text-[11px] font-medium transition ${category === item ? 'border-pastel-sageBorder bg-pastel-sageLight text-emerald-900' : 'border-app-border bg-white text-stone-500 hover:bg-stone-50'}`}>{category === item && <Check className="mr-1 inline h-3 w-3"/>}{item}</button>)}</div></fieldset>
          </div>
          {validationMessage && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{validationMessage}</p>}
        </div>
      </form>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-app-border bg-white px-5 py-4 sm:px-7">
        <span className="hidden text-[11px] text-stone-400 sm:block">{title.trim() ? 'Ready to add to your schedule' : 'A clear title helps you get started'}</span>
        <div className="ml-auto flex items-center gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-app-border px-4 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50">Cancel</button><button type="submit" form="task-form" className="rounded-xl border border-pastel-sageBorder bg-pastel-sageLight px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-soft-sm transition hover:bg-[#DDE9DC]">{initialTask ? 'Save changes' : 'Create task'}</button></div>
      </footer>
    </section>
  </div>;
};
