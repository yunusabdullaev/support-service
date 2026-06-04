'use client';

import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { LogOut, Bell } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 backdrop-blur-md border-b flex items-center justify-between px-6 z-30 navbar">
      {/* Left: System Status */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm text-slate-400">{t('system_online')}</span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-3 ml-1 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
