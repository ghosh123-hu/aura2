import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Sparkles,
  Shield,
  BarChart3,
  Settings,
  Flame,
  Menu,
  X,
  Compass,
  Timer,
  Clock3,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageView } from '../types';
import { calculateTaskStats } from '../utils/analyticsEngine';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    currentView,
    setCurrentView,
    tasks,
    settings,
    user,
    logout,
  } = useApp();
  const taskStats = calculateTaskStats(tasks);

  const navItems: { id: PageView; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: taskStats.pendingTasks > 0 ? taskStats.pendingTasks : undefined,
    },
    { id: 'focus', label: 'Focus Mode', icon: <Timer className="w-4 h-4" /> },
    { id: 'time-audit', label: 'Time Audit', icon: <Clock3 className="w-4 h-4" /> },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'habits',
      label: 'Habits',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'addiction',
      label: 'Addiction Tracker',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (view: PageView) => {
    setCurrentView(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-app-border flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-app-border/70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-emerald-800 font-bold shadow-soft-sm">
                A
              </div>
              <div>
                <span className="font-semibold text-base text-app-text tracking-tight">
                  Aura
                </span>
                <span className="block text-[11px] text-app-muted tracking-normal">
                  Personal Productivity
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Streak Callout */}
          <div className="mx-4 mt-4 p-3 bg-stone-50 rounded-xl border border-app-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pastel-yellowLight text-amber-700">
                <Flame className="w-4 h-4 fill-amber-500/20" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                  Active Streak
                </div>
                <div className="text-sm font-semibold text-app-text">
                  {taskStats.currentStreakDays} {taskStats.currentStreakDays === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-stone-400 font-medium px-2 py-0.5 rounded-md bg-white border border-stone-200">
              Live
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-stone-100 text-stone-900 font-semibold shadow-soft-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isActive ? 'text-stone-900' : 'text-stone-400'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-stone-200 text-stone-800'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-app-border/70">
          <div className="flex items-center justify-between bg-stone-50/80 rounded-xl p-1.5 border border-stone-200/60">
            <button
              onClick={() => handleNavClick('settings')}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-lg hover:bg-stone-100/60 transition"
              title="Open Settings"
            >
              <div className="w-8 h-8 rounded-full bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-xs font-bold text-emerald-800 shrink-0">
                {settings.name
                  ? settings.name.charAt(0).toUpperCase()
                  : user?.email
                  ? user.email.charAt(0).toUpperCase()
                  : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-app-text truncate">
                  {settings.name || (user?.email ? user.email.split('@')[0] : 'Workspace')}
                </p>
                <p className="text-[10px] text-stone-400 truncate">
                  {user?.email || 'Authenticated'}
                </p>
              </div>
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-app-border px-2 py-2 flex items-center justify-around lg:hidden shadow-soft-md">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${
            currentView === 'dashboard' ? 'text-stone-900 font-semibold' : 'text-stone-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setCurrentView('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${
            currentView === 'tasks' ? 'text-stone-900 font-semibold' : 'text-stone-400'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${
            currentView === 'calendar' ? 'text-stone-900 font-semibold' : 'text-stone-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setCurrentView('habits')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${
            currentView === 'habits' ? 'text-stone-900 font-semibold' : 'text-stone-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Habits</span>
        </button>
        <button
          onClick={() => setCurrentView('focus')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${currentView === 'focus' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}
        >
          <Timer className="w-4 h-4" />
          <span>Focus</span>
        </button>
        <button
          onClick={() => setCurrentView('time-audit')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${currentView === 'time-audit' ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}
        >
          <Clock3 className="w-4 h-4" />
          <span>Time</span>
        </button>
        <button
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-medium transition ${
            currentView === 'analytics' ? 'text-stone-900 font-semibold' : 'text-stone-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
      </div>
    </>
  );
};
