'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState, useEffect } from 'react';
import {
  LayoutDashboard, Bug, MessageSquare, Lightbulb, Activity,
  AlertTriangle, BookOpen, BarChart3, Users, Settings, Package,
  ShieldCheck, Zap, UserCheck, Frown, CalendarDays, ContactRound, X
} from 'lucide-react';

// Context for sidebar open/close state (mobile)
const SidebarContext = createContext<{ isOpen: boolean; toggle: () => void; close: () => void }>({
  isOpen: false, toggle: () => {}, close: () => {},
});

export function useSidebar() { return useContext(SidebarContext); }

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(v => !v);
  const close = () => setIsOpen(false);
  return <SidebarContext.Provider value={{ isOpen, toggle, close }}>{children}</SidebarContext.Provider>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();
  const { isOpen, close } = useSidebar();

  // Close sidebar on route change (mobile)
  useEffect(() => { close(); }, [pathname]);

  const navItems = [
    { href: '/dashboard',      label: t('nav_dashboard'),       icon: LayoutDashboard, roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/difficulties',   label: t('nav_difficulties'),    icon: Frown,           roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/bugs',           label: t('nav_bugs'),            icon: Bug,             roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/improvements',   label: t('nav_improvements'),   icon: Lightbulb,       roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/clients',        label: t('nav_clients'),         icon: UserCheck,       roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'SELLER'] },
    { href: '/knowledge-base', label: t('nav_knowledge_base'), icon: BookOpen,        roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR'] },
    { href: '/dialog-reviews', label: t('nav_dialog_reviews'), icon: MessageSquare,   roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/shifts',          label: t('nav_shifts') || 'Smen jadvali', icon: CalendarDays, roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR'] },
    { href: '/operators',       label: 'Operatorlar haqida', icon: ContactRound, roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/monitoring',     label: t('nav_monitoring'),      icon: Activity,        roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/incidents',      label: t('nav_incidents'),       icon: AlertTriangle,   roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/reports',        label: t('nav_reports'),         icon: BarChart3,       roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/users',          label: t('nav_users'),           icon: Users,           roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/products',       label: t('nav_products'),        icon: Package,         roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/settings',       label: t('nav_settings'),        icon: Settings,        roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER', 'SELLER'] },
  ];

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full w-64 flex flex-col z-50 sidebar transition-transform duration-300',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Hippo Support</p>
              <p className="text-xs text-slate-500">Control Center</p>
            </div>
          </div>
          <button onClick={close} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {filtered.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
