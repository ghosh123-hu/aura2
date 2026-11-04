import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock3, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActiveFocusSession } from '../types';
import { format, isSameDay, startOfWeek, subDays } from 'date-fns';

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export const FocusView: React.FC = () => {
  const { tasks, focusSessions, activeFocus, setActiveFocus, finishFocusSession, showToast, activeTimeTracker, timeEntries } = useApp();
  const [duration, setDuration] = useState(25);
  const [custom, setCustom] = useState('35');
  const [taskId, setTaskId] = useState('');
  const [tick, setTick] = useState(0);
  const [reminder, setReminder] = useState(false);

  useEffect(() => {
    if (!activeFocus || activeFocus.status !== 'running') return;
    const timer = window.setInterval(() => {
      setTick((n) => n + 1);
      const elapsed = Math.max(1, Math.floor((Date.now() - Date.parse(activeFocus.updatedAt)) / 1000));
      const next = { ...activeFocus, remainingSeconds: Math.max(0, activeFocus.remainingSeconds - elapsed), updatedAt: new Date().toISOString() };
      if (next.remainingSeconds === 0) {
        finishFocusSession(next, true);
        setReminder(true);
      } else setActiveFocus(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeFocus, finishFocusSession, setActiveFocus]);

  // Recover elapsed time while the app was closed or in the background.
  useEffect(() => {
    if (activeFocus?.status !== 'running') return;
    const elapsed = Math.floor((Date.now() - Date.parse(activeFocus.updatedAt)) / 1000);
    if (elapsed > 1) {
      const next = { ...activeFocus, remainingSeconds: Math.max(0, activeFocus.remainingSeconds - elapsed), updatedAt: new Date().toISOString() };
      if (next.remainingSeconds === 0) { finishFocusSession(next, true); setReminder(true); }
      else setActiveFocus(next);
    }
  // Only perform recovery when the view mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date();
  const todaySessions = focusSessions.filter((s) => isSameDay(new Date(s.endedAt), today));
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekSessions = focusSessions.filter((s) => new Date(s.endedAt) >= weekStart && new Date(s.endedAt) <= today);
  const weekly = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const minutes = focusSessions.filter((s) => isSameDay(new Date(s.endedAt), date)).reduce((sum, s) => sum + s.durationMinutes, 0);
    return { label: format(date, 'EEE'), minutes };
  }), [focusSessions, tick]);
  const selectedTask = tasks.find((task) => task.id === activeFocus?.taskId);
  const progress = activeFocus ? 1 - activeFocus.remainingSeconds / (activeFocus.durationMinutes * 60) : 0;

  const start = () => {
    if (activeTimeTracker) { showToast('Stop the Time Audit timer before starting a focus session.', 'error'); return; }
    const minutes = duration === -1 ? Number(custom) : duration;
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) { showToast('Choose a duration between 1 and 240 minutes.', 'error'); return; }
    const now = Date.now();
    if (timeEntries.some((entry) => now < Date.parse(entry.endedAt) && now + minutes * 60000 > Date.parse(entry.startedAt))) {
      showToast('This focus session overlaps a recorded activity. Adjust or remove that time entry first.', 'error'); return;
    }
    const task = tasks.find((item) => item.id === taskId);
    const session: ActiveFocusSession = { taskId: task?.id, taskTitle: task?.title || 'Personal focus', durationMinutes: minutes, remainingSeconds: minutes * 60, status: 'running', updatedAt: new Date().toISOString() };
    setActiveFocus(session);
    setReminder(false);
  };

  const togglePause = () => activeFocus && setActiveFocus({ ...activeFocus, status: activeFocus.status === 'running' ? 'paused' : 'running', updatedAt: new Date().toISOString() });
  const end = () => activeFocus && finishFocusSession(activeFocus, false);
  const cards = [
    { label: 'Today', value: `${todaySessions.reduce((n, s) => n + s.durationMinutes, 0)} min`, detail: `${todaySessions.length} sessions` },
    { label: 'This week', value: `${weekSessions.reduce((n, s) => n + s.durationMinutes, 0)} min`, detail: `${weekSessions.length} sessions` },
  ];

  return (
    <div className="space-y-7 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1"><Sparkles className="w-4 h-4 text-pastel-sage"/> Focus & Flow</div><h1 className="text-2xl font-bold tracking-tight">Focus Mode</h1><p className="text-sm text-stone-500 mt-1">A little quiet space for the work that matters.</p></div>
        {activeFocus && <button onClick={end} className="text-sm text-stone-500 hover:text-stone-900 flex items-center gap-2"><X className="w-4 h-4"/> End session</button>}
      </div>

      {reminder && <div className="rounded-2xl border border-pastel-sageBorder bg-pastel-sageLight/60 p-4 flex items-center justify-between"><div><p className="font-semibold text-emerald-900">Lovely work. Your focus session is complete.</p><p className="text-sm text-emerald-800/80 mt-1">Take a short break, stretch, and let your mind reset.</p></div><button onClick={() => setReminder(false)} className="text-emerald-800 p-2" aria-label="Dismiss break reminder"><X className="w-4 h-4"/></button></div>}

      <section className={`rounded-3xl border border-app-border shadow-soft overflow-hidden ${activeFocus ? 'fixed inset-0 z-50 rounded-none bg-[#F8F7F3] flex flex-col justify-center' : 'bg-white'}`}>
        {activeFocus ? <div className="w-full max-w-3xl mx-auto px-6 py-12 text-center">
          <button onClick={end} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-800" aria-label="End focus session"><ArrowLeft className="w-5 h-5"/></button>
          <p className="text-xs uppercase tracking-[.2em] text-stone-400">{activeFocus.status === 'paused' ? 'Paused' : 'In your focus zone'}</p>
          <h2 className="mt-4 text-xl sm:text-2xl font-semibold text-stone-700">{activeFocus.taskTitle}</h2>
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-9 rounded-full bg-white border border-stone-100 shadow-soft flex items-center justify-center">
            <div className="absolute inset-3 rounded-full border-[6px] border-stone-100" style={{ background: `conic-gradient(#94B49F ${progress * 360}deg, transparent 0deg)` }}/><div className="absolute inset-5 rounded-full bg-[#F8F7F3]"/><div className="relative"><div className="text-6xl sm:text-7xl tabular-nums font-light tracking-tight">{formatTime(activeFocus.remainingSeconds)}</div><p className="text-xs text-stone-400 mt-2">of {activeFocus.durationMinutes} minutes</p></div>
          </div>
          <div className="max-w-sm mx-auto mb-7"><div className="flex justify-between text-xs text-stone-400 mb-2"><span>Session progress</span><span>{Math.round(progress * 100)}%</span></div><div className="h-2 rounded-full bg-stone-200 overflow-hidden"><div className="h-full rounded-full bg-[#94B49F] transition-all" style={{ width: `${progress * 100}%` }}/></div></div>
          <div className="flex justify-center gap-3"><button onClick={togglePause} className="rounded-xl bg-[#94B49F] hover:bg-[#83A58F] text-white px-6 py-3 font-semibold flex items-center gap-2">{activeFocus.status === 'running' ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Resume</>}</button><button onClick={end} className="rounded-xl bg-white border border-stone-200 px-6 py-3 font-medium text-stone-600">End session</button></div>
          <p className="text-xs text-stone-400 mt-6">Take a short 5 minute break when you finish.</p>
        </div> : <div className="grid lg:grid-cols-[1fr_300px]">
          <div className="p-6 sm:p-9 border-b lg:border-b-0 lg:border-r border-stone-100">
            <div className="flex items-center gap-2 text-sm text-stone-500"><Clock3 className="w-4 h-4"/> Choose your focus session</div>
            <div className="grid grid-cols-3 gap-3 mt-5">{[{ value: 25, title: '25 / 5', sub: 'Pomodoro' }, { value: 50, title: '50 / 10', sub: 'Deep focus' }, { value: -1, title: 'Custom', sub: 'Your rhythm' }].map((item) => <button key={item.value} onClick={() => setDuration(item.value)} className={`rounded-2xl border p-4 text-left transition ${duration === item.value ? 'border-[#94B49F] bg-pastel-sageLight/50 ring-1 ring-[#94B49F]' : 'border-stone-200 hover:bg-stone-50'}`}><div className="font-bold text-stone-800">{item.title}</div><div className="text-xs text-stone-400 mt-1">{item.sub}</div></button>)}</div>
            {duration === -1 && <label className="block mt-4 text-sm text-stone-600">Duration in minutes<input type="number" min="1" max="240" value={custom} onChange={(e) => setCustom(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 bg-white"/></label>}
            <label className="block mt-6 text-sm text-stone-600">Focus on a task <span className="text-stone-400">· optional</span><select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-3 bg-white"><option value="">Personal focus</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}{task.completed ? ' · completed' : ''}</option>)}</select></label>
            <button onClick={start} className="mt-6 w-full sm:w-auto rounded-xl bg-[#94B49F] hover:bg-[#83A58F] text-white px-7 py-3 font-semibold flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-current"/> Start focusing</button>
            <p className="mt-4 text-xs text-stone-400">You can pause or end your session at any time. Completed sessions update task time automatically.</p>
          </div>
          <aside className="bg-stone-50/60 p-6 sm:p-7"><h3 className="font-semibold text-stone-800">Your focus rhythm</h3><div className="grid grid-cols-2 gap-3 mt-4">{cards.map((c) => <div key={c.label} className="rounded-2xl bg-white p-4 border border-stone-100"><div className="text-xs text-stone-400">{c.label}</div><div className="text-xl font-bold mt-2">{c.value}</div><div className="text-xs text-stone-400 mt-1">{c.detail}</div></div>)}</div>
            <div className="mt-6"><div className="flex items-center justify-between"><h4 className="text-sm font-semibold">Last 7 days</h4><span className="text-xs text-stone-400">minutes</span></div><div className="h-32 flex items-end gap-2 mt-4">{weekly.map((d) => <div key={d.label} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><div title={`${d.minutes} minutes`} className="w-full max-w-7 rounded-t-md bg-[#B8CDBE] min-h-[3px]" style={{ height: `${Math.max(3, Math.min(100, d.minutes / Math.max(1, ...weekly.map((x) => x.minutes)) * 100))}%` }}/><span className="text-[10px] text-stone-400">{d.label}</span></div>)}</div><p className="text-xs text-stone-400 mt-3">{weekSessions.length ? `${weekSessions.length} sessions recorded this week` : 'Your completed sessions will show here.'}</p></div>
            <div className="mt-6 p-3 rounded-xl bg-pastel-yellowLight/50 text-xs text-amber-900 flex items-start gap-2"><Check className="w-4 h-4 shrink-0 mt-0.5"/>A short break reminder appears after each completed session.</div>
          </aside>
        </div>}
      </section>
      {!activeFocus && <div className="flex items-center gap-2 text-xs text-stone-400"><RotateCcw className="w-3.5 h-3.5"/> Your focus history is saved on this device.</div>}
    </div>
  );
};
