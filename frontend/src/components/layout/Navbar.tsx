'use client';

import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useSidebar } from '@/components/layout/Sidebar';
import { LogOut, Bell, Menu, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 backdrop-blur-md border-b flex items-center justify-between px-4 sm:px-6 z-30 navbar">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
        <span className="text-sm text-slate-400 hidden sm:block">{t('system_online')}</span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 ml-1 border-l border-slate-700">
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
