import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlarmClock, BarChart3, CalendarDays, CirclePlus, Clock3, Pencil, Play, Plus, Sparkles, Square, Trash2, X } from 'lucide-react';
import { addDays, format, isSameDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TimeEntry } from '../types';
import { useApp } from '../context/AppContext';

const COLORS = ['#94B49F', '#82A8D1', '#E6C464', '#B8A8D8', '#E29587', '#C9B8A3', '#A5B4C5'];
const localInputValue = (date: Date) => { const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); };
const prettyTime = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`;
const categoryColor = (name: string, categories: string[]) => COLORS[((categories.indexOf(name) % COLORS.length) + COLORS.length) % COLORS.length];

export const TimeAuditView: React.FC = () => {
  const { timeEntries, timeCategories, addTimeEntry, updateTimeEntry, deleteTimeEntry, addTimeCategory, activeTimeTracker, setActiveTimeTracker, stopTimeTracker, tasks, activeFocus, showToast } = useApp();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [category, setCategory] = useState('Study');
  const [activity, setActivity] = useState('');
  const [taskId, setTaskId] = useState('');
  const [startedAt, setStartedAt] = useState(localInputValue(new Date(Date.now() - 60 * 60 * 1000)));
  const [endedAt, setEndedAt] = useState(localInputValue(new Date()));
  const [customCategory, setCustomCategory] = useState('');
  const [quickCategory, setQuickCategory] = useState('Study');
  const [quickActivity, setQuickActivity] = useState('');
  const [quickTaskId, setQuickTaskId] = useState('');

  useEffect(() => {
    if (!activeTimeTracker) return;
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeTimeTracker]);

  const dateKey = format(selectedDay, 'yyyy-MM-dd');
  const dayEntries = useMemo(() => timeEntries.filter((entry) => isSameDay(new Date(entry.startedAt), selectedDay)), [timeEntries, selectedDay]);
  const minutesFor = (entries: TimeEntry[]) => entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const categoryTotals = useMemo(() => timeCategories.map((name, index) => ({ name, minutes: minutesFor(dayEntries.filter((entry) => entry.category === name)), color: COLORS[index % COLORS.length] })).filter((item) => item.minutes > 0).sort((a, b) => b.minutes - a.minutes), [dayEntries, timeCategories]);
  const socialMinutes = minutesFor(dayEntries.filter((entry) => entry.category === 'Social Media'));
  const studyMinutes = minutesFor(dayEntries.filter((entry) => entry.category === 'Study'));
  const distractionMinutes = minutesFor(dayEntries.filter((entry) => ['Social Media', 'Entertainment'].includes(entry.category)));
  const plannedTasks = tasks.filter((task) => task.date === dateKey);
  const plannedMinutes = plannedTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
  const linkedActualMinutes = minutesFor(dayEntries.filter((entry) => entry.taskId && plannedTasks.some((task) => task.id === entry.taskId)));
  const plannedActual = [
    { label: 'Planned', minutes: plannedMinutes },
    { label: 'Actual', minutes: linkedActualMinutes },
  ];

  const hours = Array.from({ length: 24 }, (_, hour) => {
    const buckets: Record<string, number> = {};
    const bucketStart = new Date(selectedDay); bucketStart.setHours(hour, 0, 0, 0);
    const bucketEnd = new Date(selectedDay); bucketEnd.setHours(hour + 1, 0, 0, 0);
    dayEntries.forEach((entry) => {
      const start = new Date(entry.startedAt), end = new Date(entry.endedAt);
      const overlap = Math.max(0, Math.min(end.getTime(), bucketEnd.getTime()) - Math.max(start.getTime(), bucketStart.getTime()));
      if (overlap > 0) buckets[entry.category] = (buckets[entry.category] || 0) + overlap / 60000;
    });
    return { hour, buckets, total: Object.values(buckets).reduce((a, b) => a + b, 0) };
  });

  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 });
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const entries = timeEntries.filter((entry) => isSameDay(new Date(entry.startedAt), day));
    return { label: format(day, 'EEE'), ...Object.fromEntries(timeCategories.map((name) => [name, minutesFor(entries.filter((entry) => entry.category === name))])) };
  });
  const monthStart = startOfMonth(selectedDay);
  const dayCount = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 0).getDate();
  const monthly = Array.from({ length: dayCount }, (_, i) => {
    const day = addDays(monthStart, i);
    const entries = timeEntries.filter((entry) => isSameDay(new Date(entry.startedAt), day));
    return { label: format(day, 'd'), total: minutesFor(entries), isSelected: isSameDay(day, selectedDay) };
  });
  const topActivities = Object.values(dayEntries.reduce<Record<string, { label: string; minutes: number; category: string }>>((acc, entry) => {
    const key = entry.activity.trim() || entry.category;
    if (!acc[key]) acc[key] = { label: key, minutes: 0, category: entry.category };
    acc[key].minutes += entry.durationMinutes;
    return acc;
  }, {})).sort((a, b) => b.minutes - a.minutes).slice(0, 5);

  const openNew = () => {
    setEditing(null); setCategory(timeCategories[0] || 'Personal'); setActivity(''); setTaskId('');
    const start = new Date(selectedDay);
    if (isSameDay(selectedDay, new Date())) start.setTime(Date.now() - 60 * 60 * 1000);
    else start.setHours(9, 0, 0, 0);
    const end = isSameDay(selectedDay, new Date()) ? new Date() : new Date(start.getTime() + 60 * 60 * 1000);
    setStartedAt(localInputValue(start)); setEndedAt(localInputValue(end)); setModalOpen(true);
  };
  const openEdit = (entry: TimeEntry) => {
    setEditing(entry); setCategory(entry.category); setActivity(entry.activity); setTaskId(entry.taskId || '');
    setStartedAt(localInputValue(new Date(entry.startedAt))); setEndedAt(localInputValue(new Date(entry.endedAt))); setModalOpen(true);
  };
  const saveEntry = (event: React.FormEvent) => {
    event.preventDefault();
    const start = new Date(startedAt), end = new Date(endedAt);
    if (!(end > start)) { showToast('End time must be later than start time.', 'error'); return; }
    const data = { category, activity: activity.trim() || category, startedAt: start.toISOString(), endedAt: end.toISOString(), taskId: taskId || undefined };
    if (editing && !updateTimeEntry(editing.id, data)) return;
    if (!editing && !addTimeEntry(data)) return;
    setModalOpen(false); showToast(editing ? 'Time entry updated.' : 'Time entry saved.', 'success');
  };
  const addCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!customCategory.trim()) return;
    addTimeCategory(customCategory); setCategory(customCategory.trim()); setQuickCategory(customCategory.trim()); setCustomCategory('');
    showToast('Category added.', 'success');
  };
  const startTimer = () => {
    if (activeFocus) { showToast('End your Focus Mode session before starting another timer.', 'error'); return; }
    if (activeTimeTracker) { showToast('Stop the current timer first.', 'error'); return; }
    const task = tasks.find((item) => item.id === quickTaskId);
    setActiveTimeTracker({ category: quickCategory, activity: quickActivity.trim() || task?.title || quickCategory, startedAt: new Date().toISOString(), taskId: task?.id });
  };
  const elapsedSeconds = activeTimeTracker ? Math.max(0, Math.floor((tick - Date.parse(activeTimeTracker.startedAt)) / 1000)) : 0;
  const focusLinkedEntryIds = new Set(timeEntries.filter((entry) => entry.focusSessionId).map((entry) => entry.focusSessionId));

  return <div className="space-y-7 pb-16">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1"><Activity className="w-4 h-4 text-pastel-lavender"/> Awareness, not judgment</div><h1 className="text-2xl font-bold tracking-tight">Time Audit</h1><p className="text-sm text-stone-500 mt-1">See where your hours go, using only your recorded time.</p></div><button onClick={openNew} className="rounded-xl bg-[#94B49F] hover:bg-[#83A58F] text-white px-4 py-2.5 text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4"/> Log time</button></header>

    <section className="grid lg:grid-cols-[1fr_1fr] gap-4">
      <div className="rounded-2xl bg-white border border-app-border shadow-soft p-5"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-stone-400">Quick timer</p><h2 className="font-semibold mt-1">Track an activity as it happens</h2></div><AlarmClock className="w-5 h-5 text-pastel-blue"/></div>
        {activeTimeTracker ? <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-pastel-sageLight/60 border border-pastel-sageBorder p-4"><div><div className="text-xs text-emerald-800">Now tracking · {activeTimeTracker.category}</div><div className="font-semibold mt-1">{activeTimeTracker.activity}</div><div className="text-2xl tabular-nums font-light mt-1">{String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:{String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}</div></div><button onClick={stopTimeTracker} className="rounded-xl bg-white border border-stone-200 px-4 py-2 text-sm font-medium flex items-center gap-2"><Square className="w-4 h-4"/> Stop & save</button></div> : <div className="mt-4 grid sm:grid-cols-[140px_1fr_1fr_auto] gap-2"><select value={quickCategory} onChange={(e) => setQuickCategory(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm">{timeCategories.map((item) => <option key={item}>{item}</option>)}</select><input value={quickActivity} onChange={(e) => setQuickActivity(e.target.value)} placeholder="What are you doing?" className="min-w-0 rounded-xl border border-stone-200 px-3 py-2.5 text-sm"/><select value={quickTaskId} onChange={(e) => setQuickTaskId(e.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"><option value="">No task link</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select><button onClick={startTimer} disabled={!!activeFocus} className="rounded-xl bg-stone-800 disabled:bg-stone-300 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"><Play className="w-4 h-4"/> Start</button></div>}
        {activeFocus && !activeTimeTracker && <p className="text-xs text-stone-400 mt-3">A Focus Mode session is running. Focus time is automatically added to this audit when it ends.</p>}
      </div>
      <div className="rounded-2xl bg-white border border-app-border shadow-soft p-5"><div className="flex items-center gap-2"><CirclePlus className="w-4 h-4 text-pastel-lavender"/><h2 className="font-semibold">Your categories</h2></div><p className="text-xs text-stone-400 mt-1">Built-in categories plus your own.</p><div className="flex flex-wrap gap-2 mt-4">{timeCategories.map((name, i) => <span key={name} className="rounded-full px-3 py-1.5 text-xs border" style={{ color: COLORS[i % COLORS.length], borderColor: `${COLORS[i % COLORS.length]}66`, backgroundColor: `${COLORS[i % COLORS.length]}16` }}>{name}</span>)}</div><form onSubmit={addCategory} className="flex gap-2 mt-4"><input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Add a custom category" className="flex-1 min-w-0 rounded-xl border border-stone-200 px-3 py-2 text-sm"/><button className="rounded-xl bg-stone-100 hover:bg-stone-200 px-3 py-2 text-sm font-medium">Add</button></form></div>
    </section>

    <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">{[
      { label: 'Recorded today', value: prettyTime(minutesFor(dayEntries)), hint: `${dayEntries.length} time entries`, color: 'bg-pastel-sageLight' },
      { label: 'Distraction time', value: prettyTime(distractionMinutes), hint: 'Social media + entertainment', color: 'bg-pastel-roseLight' },
      { label: 'Planned vs linked actual', value: `${prettyTime(plannedMinutes)} / ${prettyTime(linkedActualMinutes)}`, hint: `${plannedTasks.length} tasks planned for the day`, color: 'bg-pastel-blueLight' },
      { label: 'Top activity', value: topActivities[0]?.label || 'No entries yet', hint: topActivities[0] ? prettyTime(topActivities[0].minutes) : 'Log time to find a pattern', color: 'bg-pastel-lavenderLight' },
    ].map((item) => <div key={item.label} className={`rounded-2xl ${item.color} border border-white/80 p-4`}><div className="text-xs text-stone-500">{item.label}</div><div className="text-xl font-bold mt-2 truncate" title={item.value}>{item.value}</div><div className="text-[11px] text-stone-400 mt-1">{item.hint}</div></div>)}</section>

    <section className="rounded-2xl bg-white border border-app-border shadow-soft p-5 sm:p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="font-semibold">Daily 24-hour breakdown</h2><p className="text-xs text-stone-400 mt-1">Logged activity across the selected day.</p></div><div className="flex items-center gap-2"><button onClick={() => setSelectedDay(subDays(selectedDay, 1))} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">Previous</button><input type="date" value={dateKey} onChange={(e) => e.target.value && setSelectedDay(new Date(`${e.target.value}T12:00:00`))} className="rounded-lg border border-stone-200 px-3 py-2 text-sm"/><button onClick={() => setSelectedDay(addDays(selectedDay, 1))} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">Next</button></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 mt-6"><div className="space-y-1.5">{hours.map((row) => { const active = Object.entries(row.buckets).sort((a, b) => b[1] - a[1])[0]; return <div key={row.hour} className="grid grid-cols-[42px_1fr_80px] gap-3 items-center text-xs"><span className="text-stone-400 tabular-nums">{format(new Date(2000, 0, 1, row.hour), 'ha')}</span><div className="h-5 rounded-md bg-stone-50 overflow-hidden">{active && <div title={`${active[0]} · ${Math.round(active[1])}m`} className="h-full rounded-md" style={{ width: `${Math.min(100, row.total / 60 * 100)}%`, background: categoryColor(active[0], timeCategories) }}/>}</div><span className="text-right text-stone-400 truncate">{active ? active[0] : '—'}</span></div>; })}</div><div className="space-y-3"><div className="flex items-start gap-3 p-4 rounded-2xl bg-pastel-yellowLight/60 border border-pastel-yellowBorder"><Sparkles className="w-4 h-4 mt-0.5 text-amber-700 shrink-0"/><p className="text-sm leading-relaxed text-stone-700">{dayEntries.length ? `You spent ${prettyTime(socialMinutes)} on social media and ${prettyTime(studyMinutes)} studying ${isSameDay(selectedDay, new Date()) ? 'today' : `on ${format(selectedDay, 'MMMM d')}`}.` : 'Log your activities to see a personal daily insight here.'}</p></div><div className="space-y-2">{categoryTotals.length ? categoryTotals.map((item) => <div key={item.name} className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><i className="w-2 h-2 rounded-full" style={{ background: item.color }}/>{item.name}</span><span className="font-medium tabular-nums">{prettyTime(item.minutes)}</span></div>) : <p className="text-sm text-stone-400">No time recorded for this day.</p>}</div></div></div>
    </section>

    <section className="grid xl:grid-cols-2 gap-4"><div className="rounded-2xl bg-white border border-app-border shadow-soft p-5"><div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-pastel-blue"/><h2 className="font-semibold">Weekly time distribution</h2></div><p className="text-xs text-stone-400 mt-1">Minutes per category, Monday through Sunday.</p>{timeEntries.length ? <div className="h-64 mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA"/><XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8E8D88' }} axisLine={false} tickLine={false}/><YAxis tick={{ fontSize: 10, fill: '#8E8D88' }} axisLine={false} tickLine={false}/><Tooltip formatter={(value: number) => prettyTime(value)} contentStyle={{ borderRadius: 12, border: '1px solid #EBEAE5', fontSize: 12 }}/>{timeCategories.map((name, i) => <Bar key={name} dataKey={name} stackId="time" fill={COLORS[i % COLORS.length]} maxBarSize={38}/>)}</BarChart></ResponsiveContainer></div> : <div className="h-64 flex items-center justify-center text-sm text-stone-400">Weekly chart appears as you log time.</div>}</div>
      <div className="rounded-2xl bg-white border border-app-border shadow-soft p-5"><div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-pastel-lavender"/><h2 className="font-semibold">Monthly time distribution</h2></div><p className="text-xs text-stone-400 mt-1">Total recorded minutes each day of {format(selectedDay, 'MMMM')}.</p>{timeEntries.length ? <div className="h-64 mt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFEA"/><XAxis dataKey="label" interval={Math.max(0, Math.floor(dayCount / 10) - 1)} tick={{ fontSize: 10, fill: '#8E8D88' }} axisLine={false} tickLine={false}/><YAxis tick={{ fontSize: 10, fill: '#8E8D88' }} axisLine={false} tickLine={false}/><Tooltip formatter={(value: number) => prettyTime(value)} contentStyle={{ borderRadius: 12, border: '1px solid #EBEAE5', fontSize: 12 }}/><Bar dataKey="total" name="Recorded" radius={[4, 4, 0, 0]} maxBarSize={18}>{monthly.map((day) => <Cell key={day.label} fill={day.isSelected ? '#94B49F' : '#C9DDCF'}/>)}</Bar></BarChart></ResponsiveContainer></div> : <div className="h-64 flex items-center justify-center text-sm text-stone-400">Monthly chart appears as you log time.</div>}</div></section>

    <section className="grid lg:grid-cols-[1fr_1.3fr] gap-4"><div className="rounded-2xl bg-pastel-roseLight/60 border border-pastel-roseBorder p-5"><div className="text-xs uppercase tracking-wider text-rose-700">Distraction awareness</div><div className="text-2xl font-bold mt-2">{prettyTime(distractionMinutes)}</div><p className="text-sm text-stone-600 mt-1">Recorded in social media and entertainment today.</p><div className="h-2 bg-white/80 rounded-full overflow-hidden mt-4"><div className="h-full bg-pastel-rose rounded-full" style={{ width: `${Math.min(100, distractionMinutes / 600 * 100)}%` }}/></div><p className="text-[11px] text-stone-400 mt-2">Shown as a gentle nudge, based only on your logged records.</p></div>
      <div className="rounded-2xl bg-white border border-app-border shadow-soft p-5"><div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-pastel-sage"/><h2 className="font-semibold">Most time-consuming activities</h2></div><div className="mt-4 space-y-3">{topActivities.length ? topActivities.map((item, i) => <div key={item.label} className="flex items-center gap-3"><span className="w-7 h-7 rounded-lg bg-stone-50 text-stone-500 flex items-center justify-center text-xs font-semibold">{i + 1}</span><div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{item.label}</div><div className="text-xs text-stone-400">{item.category}</div></div><span className="text-sm font-semibold tabular-nums">{prettyTime(item.minutes)}</span></div>) : <p className="text-sm text-stone-400">Activities will appear here after you record time.</p>}</div></div></section>

    <section className="rounded-2xl bg-white border border-app-border shadow-soft overflow-hidden"><div className="p-5 border-b border-stone-100"><h2 className="font-semibold">Time entries</h2><p className="text-xs text-stone-400 mt-1">Edit or remove manually logged and Focus Mode time.</p></div>{dayEntries.length ? <div className="divide-y divide-stone-100">{dayEntries.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map((entry) => <div key={entry.id} className="px-5 py-3 flex items-center gap-3"><span className="w-2 h-8 rounded-full" style={{ background: categoryColor(entry.category, timeCategories) }}/><div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{entry.activity}</div><div className="text-xs text-stone-400">{entry.category} · {format(new Date(entry.startedAt), 'h:mm a')}–{format(new Date(entry.endedAt), 'h:mm a')} · {prettyTime(entry.durationMinutes)}{entry.focusSessionId && focusLinkedEntryIds.has(entry.focusSessionId) ? ' · Focus session' : ''}</div></div><button onClick={() => openEdit(entry)} className="p-2 text-stone-400 hover:text-stone-800" aria-label="Edit entry"><Pencil className="w-4 h-4"/></button><button onClick={() => deleteTimeEntry(entry.id)} className="p-2 text-stone-400 hover:text-rose-700" aria-label="Delete entry"><Trash2 className="w-4 h-4"/></button></div>)}</div> : <div className="p-8 text-center text-sm text-stone-400">No time entries for {format(selectedDay, 'MMMM d')} yet.</div>}</section>

    {modalOpen && <div className="fixed inset-0 z-[60] bg-stone-900/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}><form onSubmit={saveEntry} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-white shadow-soft-lg p-6 space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{editing ? 'Edit time entry' : 'Log time'}</h2><p className="text-xs text-stone-400 mt-1">Record an activity you have already completed.</p></div><button type="button" onClick={() => setModalOpen(false)} className="p-2 text-stone-400"><X className="w-5 h-5"/></button></div><label className="block text-sm text-stone-600">Category<select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 bg-white">{timeCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm text-stone-600">Activity<input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. Read chapter 4" className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5"/></label><div className="grid sm:grid-cols-2 gap-3"><label className="block text-sm text-stone-600">Start time<input type="datetime-local" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5"/></label><label className="block text-sm text-stone-600">End time<input type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5"/></label></div><label className="block text-sm text-stone-600">Link to task <span className="text-stone-400">· optional</span><select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 bg-white"><option value="">No task link</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm">Cancel</button><button className="rounded-xl bg-[#94B49F] px-5 py-2.5 text-sm font-semibold text-white">{editing ? 'Save changes' : 'Save entry'}</button></div></form></div>}
  </div>;
};
