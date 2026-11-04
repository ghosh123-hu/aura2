import React, { useRef, useState } from 'react';
import {
  Check,
  Clock,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { formatFriendlyDate, formatTimeString, isDateOverdue } from '../utils/dateUtils';
import { ConfirmationModal } from './ConfirmationModal';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, compact = false }) => {
  const { toggleTaskComplete, deleteTask, rescheduleTask } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReschedulePicker, setShowReschedulePicker] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(task.date);
  const rescheduleInputRef = useRef<HTMLInputElement>(null);

  const isOverdue = isDateOverdue(task.date, task.completed);

  // Category soft colors
  const categoryStyles: Record<string, string> = {
    Work: 'bg-pastel-sageLight text-emerald-800 border-pastel-sageBorder',
    Study: 'bg-pastel-lavenderLight text-purple-900 border-pastel-lavenderBorder',
    Health: 'bg-pastel-blueLight text-sky-900 border-pastel-blueBorder',
    Personal: 'bg-pastel-yellowLight text-amber-900 border-pastel-yellowBorder',
    Finance: 'bg-pastel-roseLight text-rose-900 border-pastel-roseBorder',
    Creative: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const priorityStyles: Record<string, string> = {
    high: 'text-rose-600 bg-rose-50 border-rose-200',
    medium: 'text-amber-700 bg-amber-50 border-amber-200',
    low: 'text-stone-500 bg-stone-50 border-stone-200',
  };

  return (
    <>
      <div
        className={`group relative bg-white rounded-xl border transition-all duration-200 ${
          task.completed
            ? 'border-stone-200/60 bg-stone-50/50 opacity-75'
            : isOverdue
            ? 'border-rose-200 hover:border-rose-300 shadow-soft'
            : 'border-app-border hover:border-app-borderHover shadow-soft hover:shadow-soft-md'
        } ${compact ? 'p-3' : 'p-4'}`}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => toggleTaskComplete(task.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-pastel-sage border-pastel-sage text-white'
                : 'border-stone-300 hover:border-stone-500 bg-white'
            }`}
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`text-sm font-medium leading-snug transition-all ${
                  task.completed
                    ? 'line-through text-stone-400'
                    : 'text-app-text group-hover:text-black'
                }`}
              >
                {task.title}
              </h4>

              {/* Action Dropdown Menu Trigger */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-soft-lg border border-app-border py-1 z-30 animate-fade-in text-xs">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(task);
                        }}
                        className="w-full px-3 py-2 text-left text-app-text hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                        Edit Task
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setRescheduleDate(task.date);
                          setShowReschedulePicker(true);
                        }}
                        className="w-full px-3 py-2 text-left text-app-text hover:bg-stone-50 flex items-center gap-2"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-stone-400" />
                        Reschedule
                      </button>
                      <div className="my-1 border-t border-stone-100" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Task
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description if available & not compact */}
            {task.description && !compact && (
              <p
                className={`mt-1 text-xs leading-relaxed line-clamp-2 ${
                  task.completed ? 'text-stone-300' : 'text-stone-500'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {/* Category */}
              <span
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                  categoryStyles[task.category] || categoryStyles.Work
                }`}
              >
                {task.category}
              </span>

              {/* Priority */}
              <span
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider border ${
                  priorityStyles[task.priority] || priorityStyles.medium
                }`}
              >
                {task.priority}
              </span>

              {/* Date */}
              <div
                className={`flex items-center gap-1 text-[11px] ${
                  isOverdue ? 'text-rose-600 font-medium' : 'text-stone-500'
                }`}
              >
                {isOverdue && <AlertCircle className="w-3 h-3 text-rose-500" />}
                <Calendar className="w-3 h-3" />
                <span>{formatFriendlyDate(task.date)}</span>
              </div>

              {/* Time & Duration */}
              {task.startTime && (
                <div className="flex items-center gap-1 text-[11px] text-stone-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeString(task.startTime)}</span>
                  {task.estimatedDuration ? (
                    <span className="text-stone-400">({task.estimatedDuration}m)</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule picker modal */}
      {showReschedulePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-app-border bg-white p-5 shadow-soft-lg">
            <h4 className="text-base font-semibold text-app-text">Reschedule task</h4>
            <p className="mt-1 text-xs text-stone-500">Your scheduled start and duration will stay the same.</p>
            <div className="relative mt-4">
              <button type="button" onClick={() => { const input = rescheduleInputRef.current; if (!input) return; if ('showPicker' in input && typeof input.showPicker === 'function') input.showPicker(); else input.focus(); }} className="flex h-11 w-full items-center justify-between rounded-xl border border-app-border bg-stone-50 px-3.5 text-left">
                <span className="font-medium text-stone-800">{format(parseISO(rescheduleDate), 'dd MMM yyyy')}</span><CalendarDays className="h-4 w-4 text-stone-400"/>
              </button>
              <input ref={rescheduleInputRef} aria-label="Reschedule date" type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowReschedulePicker(false)} className="rounded-xl border border-app-border px-3.5 py-2 text-sm text-app-muted hover:bg-stone-50">Cancel</button>
              <button type="button" onClick={() => { if (rescheduleDate) rescheduleTask(task.id, rescheduleDate); setShowReschedulePicker(false); }} className="rounded-xl border border-pastel-sageBorder bg-pastel-sageLight px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-[#DDE9DC]">Save date</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          deleteTask(task.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};
