import React, { useState, useRef } from 'react';
import {
  Settings,
  User,
  Database,
  Download,
  Upload,
  Trash2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    clearData,
    exportDataJSON,
    importDataJSON,
    user,
    logout,
  } = useApp();

  const [name, setName] = useState(settings.name);
  const [greetingTitle, setGreetingTitle] = useState(settings.greetingTitle || '');
  const [dailyTaskGoal, setDailyTaskGoal] = useState(settings.dailyTaskGoal);
  const [confettiEnabled, setConfettiEnabled] = useState(settings.confettiEnabled);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim(),
      greetingTitle: greetingTitle.trim(),
      dailyTaskGoal: Number(dailyTaskGoal) || 3,
      confettiEnabled,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJSON(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          <Settings className="w-3.5 h-3.5 text-stone-500" />
          <span>System & Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-app-text tracking-tight">Settings & Workspace</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Manage your account session, profile targets, and workspace data.
        </p>
      </div>

      {/* 1. Aura Account Session Card */}
      <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pastel-sageLight border border-pastel-sageBorder flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-app-text">Aura Account & Session</h2>
              <p className="text-xs text-stone-500">Authenticated via email verification code</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={logout}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-stone-50 rounded-xl border border-app-border space-y-1">
            <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">
              Email Address
            </span>
            <p className="font-medium text-stone-900 text-sm">{user?.email || 'Not logged in'}</p>
          </div>
          <div className="p-3.5 bg-stone-50 rounded-xl border border-app-border space-y-1">
            <span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">
              User ID
            </span>
            <p className="font-mono text-stone-600 text-xs truncate" title={user?.id}>
              {user?.id || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Profile & Daily Target */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-app-border shadow-soft p-5 sm:p-6 space-y-5"
      >
        <div className="pb-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-pastel-sage" />
            <h2 className="text-base font-bold text-app-text">Profile & Daily Target</h2>
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold text-stone-900 bg-pastel-sageLight hover:bg-[#DDE9DC] border border-pastel-sageBorder rounded-xl transition shadow-soft-sm"
          >
            Save Profile
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              placeholder="e.g. Alex"
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Role / Workspace Title
            </label>
            <input
              type="text"
              value={greetingTitle}
              onChange={(e) => setGreetingTitle(e.target.value)}
              placeholder="e.g. Personal Workspace"
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-app-border rounded-xl focus:bg-white focus:border-stone-400 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-app-subtle uppercase tracking-wider mb-1.5">
              Daily Completed Task Target
            </label>
            <input
              type="number"
              min={1}
              max={25}
              value={dailyTaskGoal}
              onChange={(e) => setDailyTaskGoal(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-app-border rounded-xl"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="confetti"
              checked={confettiEnabled}
              onChange={(e) => setConfettiEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-pastel-sage focus:ring-pastel-sage"
            />
            <label htmlFor="confetti" className="text-xs font-medium text-app-text cursor-pointer">
              Trigger celebratory micro-confetti on task completion
            </label>
          </div>
        </div>
      </form>

      {/* 3. Personal Data Management & Backup */}
      <div className="bg-white rounded-2xl border border-app-border shadow-soft p-5 sm:p-6 space-y-5">
        <div className="pb-3 border-b border-stone-100 flex items-center gap-2.5">
          <Database className="w-4 h-4 text-pastel-blue" />
          <h2 className="text-base font-bold text-app-text">Personal Data Management & Backup</h2>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Your tasks, habits, and self-control logs are securely stored in your personal workspace.
          You can export your complete personal workspace as a JSON backup or import an existing file at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={exportDataJSON}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-xl border border-app-border shadow-soft-sm transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Export Personal JSON</span>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-xl border border-app-border shadow-soft-sm transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Import JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {/* Clear all */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition flex items-center gap-2 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear All Personal Workspace Data"
        message="Are you sure you want to permanently clear all your tasks, habits, and self-control logs? The application will return to a completely clean, empty state."
        confirmLabel="Clear Everything"
        onConfirm={() => {
          clearData();
          setShowClearConfirm(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
