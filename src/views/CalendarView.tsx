import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { getTodayString, formatTimeString } from '../utils/dateUtils';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';

type CalendarMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC = () => {
  const { tasks, addTask, updateTask, selectedDate, setSelectedDate } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayStr = getTodayString();

  // Navigation handlers
  const handlePrev = () => {
    if (calendarMode === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (calendarMode === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (calendarMode === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (calendarMode === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(todayStr);
  };

  // Month grid days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Week grid days
  const weekDays = useMemo(() => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Tasks mapped by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasks]);

  // Tasks for the currently selected date
  const selectedDateTasks = tasksByDate[selectedDate] || [];

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSaveModal = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
  };

  // Category soft colors
  const categoryPillColors: Record<string, string> = {
    Work: 'bg-pastel-sageLight text-emerald-800 border-pastel-sageBorder',
    Study: 'bg-pastel-lavenderLight text-purple-900 border-pastel-lavenderBorder',
    Health: 'bg-pastel-blueLight text-sky-900 border-pastel-blueBorder',
    Personal: 'bg-pastel-yellowLight text-amber-900 border-pastel-yellowBorder',
    Finance: 'bg-pastel-roseLight text-rose-900 border-pastel-roseBorder',
    Creative: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Calendar & Schedule</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Visualize scheduled focus blocks, deadlines, and balance your week.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-app-border text-xs">
            {(['month', 'week', 'day'] as CalendarMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCalendarMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                  calendarMode === mode
                    ? 'bg-white text-stone-900 shadow-soft-sm font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-pastel-sageLight hover:bg-[#DDE9DC] text-stone-900 border border-pastel-sageBorder text-xs sm:text-sm font-semibold rounded-xl shadow-soft transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-app-border p-3.5 shadow-soft">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-app-text ml-2">
            {calendarMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {calendarMode === 'week' &&
              `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`}
            {calendarMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
          </span>
        </div>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-app-border transition"
        >
          Today
        </button>
      </div>

      {/* Main Layout: Calendar + Side Schedule Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View Area (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-app-border shadow-soft p-4 sm:p-5">
          {calendarMode === 'month' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {monthDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = dayStr === todayStr;
                  const isSelected = dayStr === selectedDate;
                  const dayTasks = tasksByDate[dayStr] || [];
                  const pendingCount = dayTasks.filter((t) => !t.completed).length;

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDate(dayStr)}
                      className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-stone-800 bg-stone-50/80 shadow-soft-sm'
                          : isToday
                          ? 'border-pastel-sage bg-pastel-sageLight/20 hover:bg-pastel-sageLight/40'
                          : isCurrentMonth
                          ? 'border-stone-100 hover:border-stone-300 hover:bg-stone-50/50'
                          : 'border-transparent text-stone-300 bg-stone-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            isToday
                              ? 'bg-pastel-sage text-white'
                              : isSelected
                              ? 'bg-stone-800 text-white'
                              : isCurrentMonth
                              ? 'text-app-text'
                              : 'text-stone-300'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>

                        {dayTasks.length > 0 && (
                          <span className="text-[10px] text-stone-400 font-medium">
                            {dayTasks.length}
                          </span>
                        )}
                      </div>

                      {/* Task chips list (max 2 visible, +N more) */}
                      <div className="space-y-1 mt-1">
                        {dayTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${
                              t.completed
                                ? 'bg-stone-100 text-stone-400 line-through border-stone-200'
                                : categoryPillColors[t.category] || categoryPillColors.Work
                            }`}
                          >
                            {t.startTime ? `${t.startTime} ` : ''}
                            {t.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-[10px] text-stone-400 font-medium pl-1">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calendarMode === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isToday = dayStr === todayStr;
                const isSelected = dayStr === selectedDate;
                const dayTasks = tasksByDate[dayStr] || [];

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDate(dayStr)}
                    className={`p-3 rounded-xl border min-h-[300px] cursor-pointer transition ${
                      isSelected
                        ? 'border-stone-800 bg-stone-50'
                        : isToday
                        ? 'border-pastel-sage bg-pastel-sageLight/20'
                        : 'border-stone-100 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-center pb-2 border-b border-stone-200">
                      <div className="text-[11px] font-semibold text-stone-400 uppercase">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                          isToday ? 'bg-pastel-sage text-white' : 'text-stone-800'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    <div className="space-y-2 mt-3">
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className={`p-2 rounded-lg text-xs border ${
                            t.completed
                              ? 'bg-stone-50 border-stone-200 text-stone-400 line-through'
                              : categoryPillColors[t.category] || categoryPillColors.Work
                          }`}
                        >
                          <div className="font-semibold line-clamp-1">{t.title}</div>
                          {t.startTime && (
                            <div className="text-[10px] text-stone-500 mt-1">
                              {formatTimeString(t.startTime)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {calendarMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-sm font-semibold text-app-text">
                  Hourly Schedule for {format(currentDate, 'EEEE, MMM d')}
                </span>
              </div>

              {/* Hourly timeline blocks */}
              <div className="space-y-3">
                {['09:00', '11:00', '14:00', '16:00', '18:00', '20:00'].map((hourSlot) => {
                  const matchingTasks = (tasksByDate[format(currentDate, 'yyyy-MM-dd')] || []).filter(
                    (t) => t.startTime && t.startTime.startsWith(hourSlot.split(':')[0])
                  );

                  return (
                    <div key={hourSlot} className="flex items-start gap-4 text-xs">
                      <span className="w-14 text-stone-400 font-medium py-1">{hourSlot}</span>
                      <div className="flex-1 min-h-[48px] p-2.5 rounded-xl border border-stone-100 bg-stone-50/50">
                        {matchingTasks.length === 0 ? (
                          <span className="text-stone-300 text-[11px]">Free focus slot</span>
                        ) : (
                          <div className="space-y-2">
                            {matchingTasks.map((t) => (
                              <TaskCard key={t.id} task={t} onEdit={handleEdit} compact />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Tasks Side Panel (1 col) */}
        <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <div className="text-xs font-semibold text-stone-400 uppercase">Selected Day</div>
              <h3 className="text-base font-bold text-app-text">
                {format(parseISO(selectedDate), 'EEEE, MMM d')}
              </h3>
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-app-border transition"
              title="Add task for this date"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-10">
                <ListTodo className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-app-text">Your schedule is clear</h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Add a task to plan your day.
                </p>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setModalOpen(true);
                  }}
                  className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-stone-800 bg-stone-50 hover:bg-stone-100 border border-app-border rounded-xl shadow-soft-sm transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule a task</span>
                </button>
              </div>
            ) : (
              selectedDateTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={handleEdit} compact />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
        initialTask={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  );
};
