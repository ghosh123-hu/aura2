import React, { useMemo, useState } from 'react';
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, isToday, startOfMonth, startOfWeek, subDays,
} from 'date-fns';
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getGreeting, getTodayString, formatTimeString } from '../utils/dateUtils';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { QuickAddTask } from '../components/QuickAddTask';
import { Task } from '../types';

const sageLevels = ['bg-stone-100', 'bg-[#DCE9DF]', 'bg-[#B7D0BD]', 'bg-[#8FB39B]', 'bg-[#5E8D6B]'];
const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const compactHours = (minutes: number) => {
  const value = minutes / 60;
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}h`;
};

const ContributionCalendar: React.FC<{ tasks: Task[]; entries: ReturnType<typeof useApp>['timeEntries'] }> = ({ tasks, entries }) => {
  const today = new Date();
  const start = startOfWeek(subDays(today, 364), { weekStartsOn: 0 });
  const end = startOfWeek(today, { weekStartsOn: 0 });
  const dates = eachDayOfInterval({ start, end });
  const weeks = Array.from({ length: Math.ceil(dates.length / 7) }, (_, index) => dates.slice(index * 7, index * 7 + 7));
  const startVisible = subDays(today, 364);
  const contributions = dates.map((day) => {
    const completed = tasks.filter((task) => task.completed && task.completedAt && isSameDay(new Date(task.completedAt), day)).length;
    const focusMinutes = entries.filter((entry) => isSameDay(new Date(entry.endedAt), day)).reduce((sum, entry) => sum + entry.durationMinutes, 0);
    const score = completed + focusMinutes / 60;
    const level = score <= 0 ? 0 : score < 1 ? 1 : score < 2 ? 2 : score < 4 ? 3 : 4;
    return { key: dateKey(day), day, completed, focusMinutes, level };
  });
  const byKey = new Map(contributions.map((item) => [item.key, item]));
  const monthLabels: { month: string; column: number }[] = [];
  weeks.forEach((week, column) => {
    const first = week.find((day) => day.getDate() === 1 && day >= startVisible && day <= today);
    if (first) monthLabels.push({ month: format(first, 'MMM'), column });
  });
  return <section className="rounded-2xl border border-app-border bg-white p-5 shadow-soft sm:p-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h2 className="text-base font-bold tracking-tight">Productivity contributions</h2><p className="mt-1 text-xs text-stone-500">Completed tasks and focus time over the last 365 days.</p></div><div className="rounded-xl bg-stone-50 px-3 py-2 text-right"><div className="text-sm font-bold">{contributions.reduce((sum, item) => sum + item.completed, 0)}</div><div className="text-[10px] uppercase tracking-wide text-stone-400">tasks completed</div></div></div>
    <div className="mt-5 overflow-x-auto pb-1"><div className="min-w-[740px]">
      <div className="mb-1 grid grid-cols-[28px_repeat(53,minmax(0,1fr))] gap-[3px] text-[10px] text-stone-400"> <span/>{Array.from({ length: 53 }, (_, col) => <span key={col} className="overflow-visible whitespace-nowrap">{monthLabels.find((item) => item.column === col)?.month || ''}</span>)}</div>
      <div className="grid grid-cols-[28px_repeat(53,minmax(0,1fr))] gap-x-[3px] gap-y-[3px]">{['Sun', '', 'Tue', '', 'Thu', '', 'Sat'].map((label, row) => <React.Fragment key={row}><span className="flex h-[11px] items-center text-[9px] text-stone-400">{label}</span>{weeks.map((week, col) => { const date = week[row]; const item = date ? byKey.get(dateKey(date)) : undefined; const visible = !!item && date >= startVisible && date <= today; if (!visible) return <span key={`${row}-${col}`} className="h-[11px]"/>; const hours = item!.focusMinutes / 60; return <span key={`${row}-${col}`} title={`${format(date!, 'EEE, dd MMM yyyy')} · ${item!.completed} completed ${item!.completed === 1 ? 'task' : 'tasks'} · ${compactHours(item!.focusMinutes)} focused`} aria-label={`${format(date!, 'EEE, dd MMM yyyy')}: ${item!.completed} completed tasks, ${compactHours(item!.focusMinutes)} focus`} className={`h-[11px] rounded-[3px] ${sageLevels[item!.level]} ${isToday(date!) ? 'ring-1 ring-emerald-800 ring-offset-1' : ''}`} data-focus-hours={hours}/>; })}</React.Fragment>)}</div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-stone-400">Each square is a day · activity from the last 365 days</p><div className="flex items-center gap-1.5 text-[10px] text-stone-400"><span>Less</span>{sageLevels.map((level, i) => <span key={i} className={`h-2.5 w-2.5 rounded-[3px] ${level}`}/>)}<span>More</span></div></div>
    </div></div>
  </section>;
};

const MiniCalendar: React.FC<{ tasks: Task[]; selectedDate: string; onSelect: (date: string) => void }> = ({ tasks, selectedDate, onSelect }) => {
  const [month, setMonth] = useState(new Date());
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const dates = eachDayOfInterval({ start: first, end: last });
  const tasksByDate = tasks.reduce<Record<string, Task[]>>((byDate, task) => { (byDate[task.date] ||= []).push(task); return byDate; }, {});
  const selectedTasks = tasks.filter((task) => task.date === selectedDate).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  return <section className="rounded-2xl border border-app-border bg-white p-5 shadow-soft sm:p-6">
    <div className="flex items-center justify-between"><div><h2 className="text-base font-bold tracking-tight">Mini calendar</h2><p className="mt-1 text-xs text-stone-500">Choose a day to see its schedule.</p></div><div className="flex items-center gap-1"><button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month" className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-700"><ChevronLeft className="h-4 w-4"/></button><span className="min-w-[92px] text-center text-sm font-semibold">{format(month, 'MMMM yyyy')}</span><button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month" className="rounded-lg p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-700"><ChevronRight className="h-4 w-4"/></button></div></div>
    <div className="mt-4 grid grid-cols-7 gap-y-1 text-center"><div className="mb-1 text-[10px] font-medium text-stone-400">Su</div><div className="mb-1 text-[10px] font-medium text-stone-400">Mo</div><div className="mb-1 text-[10px] font-medium text-stone-400">Tu</div><div className="mb-1 text-[10px] font-medium text-stone-400">We</div><div className="mb-1 text-[10px] font-medium text-stone-400">Th</div><div className="mb-1 text-[10px] font-medium text-stone-400">Fr</div><div className="mb-1 text-[10px] font-medium text-stone-400">Sa</div>{dates.map((day) => { const key = dateKey(day); const dayTasks = tasksByDate[key] || []; const current = isToday(day); const selected = selectedDate === key; const categoryColors: Record<string, string> = { Work: '#94B49F', Study: '#B8A8D8', Health: '#82A8D1', Personal: '#E6C464', Finance: '#E29587', Creative: '#9B9A94' }; return <button key={key} onClick={() => onSelect(key)} aria-label={`${format(day, 'dd MMMM yyyy')}${dayTasks.length ? `, ${dayTasks.length} tasks scheduled` : ''}`} className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition ${!isSameMonth(day, month) ? 'text-stone-300' : 'text-stone-600 hover:bg-stone-100'} ${current ? 'border border-[#94B49F] font-bold text-emerald-900' : ''} ${selected ? 'bg-[#94B49F] font-semibold text-white hover:bg-[#83A58F]' : ''}`}><span>{format(day, 'd')}</span>{dayTasks.length > 0 && <span className="absolute bottom-1 flex gap-[2px]">{dayTasks.slice(0, 3).map((task, index) => <i key={`${task.id}-${index}`} className="h-1 w-1 rounded-full" style={{ backgroundColor: selected ? '#fff' : categoryColors[task.category] || '#94B49F' }}/>)}</span>}</button>; })}</div>
    <div className="mt-4 border-t border-stone-100 pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-stone-700">{format(new Date(`${selectedDate}T12:00:00`), 'EEE, dd MMM')}</h3><span className="text-[10px] text-stone-400">{selectedTasks.length} {selectedTasks.length === 1 ? 'task' : 'tasks'}</span></div>{selectedTasks.length ? <div className="max-h-32 space-y-2 overflow-y-auto">{selectedTasks.map((task) => <div key={task.id} className="flex items-center gap-2 text-xs"><span className={`h-1.5 w-1.5 rounded-full ${task.completed ? 'bg-stone-300' : 'bg-[#94B49F]'}`}/><span className={`min-w-0 flex-1 truncate ${task.completed ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{task.title}</span><span className="shrink-0 text-stone-400">{task.startTime ? formatTimeString(task.startTime) : '—'}</span></div>)}</div> : <p className="text-xs text-stone-400">Nothing scheduled on this day.</p>}</div>
  </section>;
};

export const DashboardView: React.FC = () => {
  const { tasks, focusSessions, timeEntries, settings, setCurrentView, addTask, updateTask } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [calendarDate, setCalendarDate] = useState(getTodayString());
  const todayKey = getTodayString();
  const todayDate = new Date(`${todayKey}T12:00:00`);
  const greeting = getGreeting();
  const todayTasks = useMemo(() => tasks.filter((task) => task.date === todayKey).slice().sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99')), [tasks, todayKey]);
  const todayCompleted = todayTasks.filter((task) => task.completed).length;
  const todayPending = todayTasks.length - todayCompleted;
  const plannedMinutes = todayTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
  const todayTaskIds = new Set(todayTasks.map((task) => task.id));
  const committedMinutes = timeEntries.filter((entry) => entry.taskId && todayTaskIds.has(entry.taskId) && isSameDay(new Date(entry.endedAt), todayDate)).reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const percent = plannedMinutes > 0 ? Math.round(committedMinutes / plannedMinutes * 100) : 0;
  const remainingMinutes = Math.abs(plannedMinutes - committedMinutes);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(todayDate, 6 - index);
    const completed = tasks.filter((task) => task.completed && task.completedAt && isSameDay(new Date(task.completedAt), day)).length;
    const focusedMinutes = focusSessions.filter((session) => session.completed && isSameDay(new Date(session.endedAt), day)).reduce((sum, session) => sum + session.durationMinutes, 0);
    return { day, completed, focusedMinutes };
  });
  const weeklyCompleted = weekDays.reduce((sum, day) => sum + day.completed, 0);
  const weeklyFocusMinutes = weekDays.reduce((sum, day) => sum + day.focusedMinutes, 0);
  const maxDailyCompleted = Math.max(1, ...weekDays.map((day) => day.completed));
  const handleEdit = (task: Task) => { setEditingTask(task); setModalOpen(true); };
  const handleSave = (data: Omit<Task, 'id' | 'createdAt'>) => editingTask ? updateTask(editingTask.id, data) : addTask(data);

  return <div className="space-y-5 pb-16">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500"><CalendarDays className="h-3.5 w-3.5 text-stone-400"/><span>{format(new Date(), 'EEEE, dd MMM yyyy')}</span></div><h1 className="mt-1 text-2xl font-bold tracking-tight text-app-text sm:text-3xl">{greeting}{settings.name ? `, ${settings.name}` : ''}</h1></div>
      <button onClick={() => { setEditingTask(null); setModalOpen(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-pastel-sageBorder bg-pastel-sageLight px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-soft-sm transition hover:bg-[#DDE9DC]"><Plus className="h-4 w-4"/>Create task</button>
    </header>

    <section className="overflow-hidden rounded-2xl border border-app-border bg-white shadow-soft">
      <div className="flex flex-col justify-between gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><h2 className="text-lg font-bold tracking-tight">Today's tasks</h2><p className="mt-0.5 text-xs text-stone-400">{todayCompleted} completed of {todayTasks.length} scheduled</p></div><div className="flex items-center gap-2"><span className="rounded-lg bg-stone-100 px-2.5 py-1.5 text-xs font-medium text-stone-600">{todayPending} pending</span><span className="rounded-lg bg-pastel-sageLight px-2.5 py-1.5 text-xs font-medium text-emerald-900">{todayCompleted} done</span></div></div>
      {todayTasks.length ? <div className="divide-y divide-stone-100">{todayTasks.map((task) => <div key={task.id} className="px-3 py-2 sm:px-4"><TaskCard task={task} compact onEdit={handleEdit}/></div>)}</div> : <div className="px-5 py-5 text-center"><p className="text-sm font-medium text-stone-600">Nothing scheduled today.</p><p className="mt-1 text-xs text-stone-400">Add a task here or use the planner for more detail.</p></div>}
      <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-3 sm:px-5"><QuickAddTask defaultDate={todayKey} onOpenFullModal={() => { setEditingTask(null); setModalOpen(true); }}/></div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2"><MiniCalendar tasks={tasks} selectedDate={calendarDate} onSelect={setCalendarDate}/>
      <section className="rounded-2xl border border-app-border bg-white p-5 shadow-soft sm:p-6">
        <div className="flex items-center justify-between"><div><h2 className="text-base font-bold tracking-tight">Planned vs committed</h2><p className="mt-1 text-xs text-stone-500">Actual tracked time linked to today's tasks.</p></div><Clock3 className="h-4 w-4 text-stone-400"/></div>
        <div className="mt-5 grid grid-cols-2 gap-4"><div><div className="text-xs text-stone-400">Planned</div><div className="mt-1 text-2xl font-bold tabular-nums text-stone-800">{compactHours(plannedMinutes)}</div><div className="text-[11px] text-stone-400">estimated task time</div></div><div className="text-right"><div className="text-xs text-stone-400">Committed</div><div className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{compactHours(committedMinutes)}</div><div className="text-[11px] text-stone-400">tracked focus time</div></div></div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[#94B49F] transition-all" style={{ width: `${Math.min(100, percent)}%` }}/></div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-stone-700">{plannedMinutes ? `${percent}% complete` : 'No planned hours yet'}</span><span className={`${committedMinutes > plannedMinutes ? 'text-amber-700' : 'text-stone-500'}`}>{committedMinutes > plannedMinutes ? `${compactHours(remainingMinutes)} over plan` : `${compactHours(remainingMinutes)} remaining`}</span></div>
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3"><span className="text-[11px] text-stone-400">{todayTasks.length} scheduled tasks</span><button onClick={() => setCurrentView('focus')} className="text-xs font-semibold text-emerald-800 hover:text-emerald-950">Open Focus Mode <ArrowRight className="ml-1 inline h-3 w-3"/></button></div>
      </section>
    </section>

    <ContributionCalendar tasks={tasks} entries={timeEntries}/>

    <section className="rounded-2xl border border-app-border bg-white p-5 shadow-soft sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-bold tracking-tight">This week</h2><p className="mt-1 text-xs text-stone-500">Completed tasks and committed focus time from your records.</p></div><div className="flex gap-5"><div><div className="text-lg font-bold tabular-nums">{weeklyCompleted}</div><div className="text-[10px] uppercase tracking-wide text-stone-400">tasks done</div></div><div><div className="text-lg font-bold tabular-nums">{compactHours(weeklyFocusMinutes)}</div><div className="text-[10px] uppercase tracking-wide text-stone-400">focus time</div></div></div></div><div className="mt-5 grid grid-cols-7 gap-2">{weekDays.map((item) => <div key={dateKey(item.day)} className="flex flex-col items-center gap-1.5"><div className="flex h-12 w-full items-end justify-center rounded-md bg-stone-50 px-1"><span className="w-full max-w-5 rounded-t bg-[#94B49F]" style={{ height: `${item.completed ? Math.max(15, item.completed / maxDailyCompleted * 100) : 3}%` }} title={`${item.completed} completed ${item.completed === 1 ? 'task' : 'tasks'} · ${compactHours(item.focusedMinutes)} focus`}/></div><span className={`text-[10px] ${isSameDay(item.day, todayDate) ? 'font-semibold text-emerald-800' : 'text-stone-400'}`}>{format(item.day, 'EEE')}</span></div>)}</div></section>

    <TaskModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null); }} onSave={handleSave} initialTask={editingTask}/>
  </div>;
};
