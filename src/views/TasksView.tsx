import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  LayoutList,
  Columns,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { getTodayString } from '../utils/dateUtils';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { QuickAddTask } from '../components/QuickAddTask';

type TabKey = 'all' | 'today' | 'upcoming' | 'completed' | 'overdue';
type ViewMode = 'list' | 'board';

export const TasksView: React.FC = () => {
  const { tasks, addTask, updateTask } = useApp();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const today = getTodayString();

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => t.date === today && !t.completed).length,
      upcoming: tasks.filter((t) => t.date > today && !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
      overdue: tasks.filter((t) => !t.completed && t.date < today).length,
    };
  }, [tasks, today]);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'today') {
        if (task.date !== today) return false;
      } else if (activeTab === 'upcoming') {
        if (task.date <= today || task.completed) return false;
      } else if (activeTab === 'completed') {
        if (!task.completed) return false;
      } else if (activeTab === 'overdue') {
        if (task.completed || task.date >= today) return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const catMatch = task.category?.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [tasks, activeTab, selectedPriority, selectedCategory, searchQuery, today]);

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

  // Grouped for Board view
  const boardColumns = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => !t.completed && t.date >= today),
      overdue: filteredTasks.filter((t) => !t.completed && t.date < today),
      done: filteredTasks.filter((t) => t.completed),
    };
  }, [filteredTasks, today]);

  // Meaningful empty state copy
  const getEmptyState = () => {
    if (searchQuery.trim() || selectedPriority !== 'all' || selectedCategory !== 'all') {
      return {
        title: 'No matching tasks',
        desc: 'Try adjusting your search query or filters to find what you need.',
      };
    }
    if (tasks.length === 0) {
      return {
        title: 'No tasks added yet',
        desc: 'Add your first task above to start organizing your schedule.',
      };
    }
    if (activeTab === 'today') {
      return {
        title: 'No tasks planned for today',
        desc: 'Add your first task to get started.',
      };
    }
    if (activeTab === 'upcoming') {
      return {
        title: 'No upcoming tasks',
        desc: 'Schedule future tasks so you can plan your upcoming workload at a glance.',
      };
    }
    if (activeTab === 'overdue') {
      return {
        title: 'No overdue tasks',
        desc: "All clear! You're completely up to date with your planned dates.",
      };
    }
    if (activeTab === 'completed') {
      return {
        title: 'No completed tasks yet',
        desc: 'Check off finished items to begin tracking your productivity momentum.',
      };
    }
    return {
      title: 'No tasks found',
      desc: 'There are no tasks matching your current view and filters.',
    };
  };

  const emptyState = getEmptyState();

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Task Management</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Organize, prioritize, and track your deliverables across all projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-app-border">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-soft-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-medium transition ${
                viewMode === 'board'
                  ? 'bg-white text-stone-900 shadow-soft-sm font-semibold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Board View"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-pastel-sageLight hover:bg-[#DDE9DC] text-stone-900 border border-pastel-sageBorder text-xs sm:text-sm font-semibold rounded-xl shadow-soft transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <QuickAddTask onOpenFullModal={() => setModalOpen(true)} />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-app-border pb-3">
        {(
          [
            { key: 'all', label: 'All Tasks', count: counts.all },
            { key: 'today', label: 'Today', count: counts.today },
            { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { key: 'overdue', label: 'Overdue', count: counts.overdue, isAlert: counts.overdue > 0 },
            { key: 'completed', label: 'Completed', count: counts.completed },
          ] as { key: TabKey; label: string; count: number; isAlert?: boolean }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition flex items-center gap-2 ${
                isActive
                  ? 'bg-stone-900 text-white font-semibold shadow-soft-sm'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                  isActive
                    ? 'bg-stone-700 text-stone-200'
                    : tab.isAlert
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Secondary Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description, or tag..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-app-border rounded-xl focus:border-stone-400 transition"
          />
        </div>

        {/* Priority & Category Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-white border border-app-border rounded-xl text-xs text-stone-600 font-medium hover:bg-stone-50 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-app-border rounded-xl text-xs text-stone-600 font-medium hover:bg-stone-50 cursor-pointer capitalize"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Rendering: List vs Board */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-app-border shadow-soft">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-400 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-app-text">{emptyState.title}</h3>
              <p className="text-xs text-stone-500 mt-1">{emptyState.desc}</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={handleEdit} />
            ))
          )}
        </div>
      ) : (
        /* Board / Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column: To Do / Scheduled */}
          <div className="bg-stone-100/70 rounded-2xl p-4 border border-app-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pastel-blue" />
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  To Do & Scheduled
                </h3>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {boardColumns.todo.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[200px]">
              {boardColumns.todo.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">No pending tasks</div>
              ) : (
                boardColumns.todo.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} compact />
                ))
              )}
            </div>
          </div>

          {/* Column: Overdue */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Needs Rescheduling / Overdue
                </h3>
              </div>
              <span className="text-xs font-semibold text-rose-700">
                {boardColumns.overdue.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[200px]">
              {boardColumns.overdue.length === 0 ? (
                <div className="text-center py-8 text-xs text-rose-400">All tasks on schedule</div>
              ) : (
                boardColumns.overdue.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} compact />
                ))
              )}
            </div>
          </div>

          {/* Column: Done */}
          <div className="bg-stone-100/70 rounded-2xl p-4 border border-app-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pastel-sage" />
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Completed
                </h3>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {boardColumns.done.length}
              </span>
            </div>

            <div className="space-y-2.5 min-h-[200px]">
              {boardColumns.done.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-400">No completed tasks yet</div>
              ) : (
                boardColumns.done.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} compact />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveModal}
        initialTask={editingTask}
      />
    </div>
  );
};
