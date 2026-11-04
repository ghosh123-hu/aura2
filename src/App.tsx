import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { AuthView } from './components/AuthView';
import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { CalendarView } from './views/CalendarView';
import { HabitsView } from './views/HabitsView';
import { AddictionTrackerView } from './views/AddictionTrackerView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { FocusView } from './views/FocusView';
import { TimeAuditView } from './views/TimeAuditView';

export const AppContent: React.FC = () => {
  const {
    user,
    authLoading,
    currentView,
    setCurrentView,
    showToast,
    loginWithUser,
  } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Loading screen while resolving user session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-emerald-800 font-bold text-xl shadow-soft animate-pulse">
            A
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-base font-bold text-stone-900 tracking-tight">Aura</h1>
            <p className="text-xs text-stone-500">Preparing workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Protected routes: If not authenticated, show Email Code AuthView
  if (!user) {
    return (
      <>
        <AuthView onSuccess={(u) => loginWithUser(u)} showToast={showToast} />
        <Toast />
      </>
    );
  }

  // 3. Authenticated workspace view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksView />;
      case 'focus':
        return <FocusView />;
      case 'time-audit':
        return <TimeAuditView />;
      case 'calendar':
        return <CalendarView />;
      case 'habits':
        return <HabitsView />;
      case 'addiction':
        return <AddictionTrackerView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#252525] flex flex-col">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile Header Bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-app-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-emerald-800 font-bold text-xs">
                A
              </div>
              <span className="font-bold text-sm tracking-tight text-app-text">Aura</span>
            </div>
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {currentView}
          </span>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderView()}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  );
};

export default function App() {
  return <AppContent />;
}
