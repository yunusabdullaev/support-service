'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Bug, MessageSquare, Lightbulb, Activity,
  AlertTriangle, BookOpen, BarChart3, Users, Settings, Package,
  ShieldCheck, Zap, UserCheck, Frown
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { href: '/dashboard',      label: t('nav_dashboard'),       icon: LayoutDashboard, roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/difficulties',   label: t('nav_difficulties'),    icon: Frown,           roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/bugs',           label: t('nav_bugs'),            icon: Bug,             roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/improvements',   label: t('nav_improvements'),   icon: Lightbulb,       roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
    { href: '/clients',        label: t('nav_clients'),         icon: UserCheck,       roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR'] },
    { href: '/knowledge-base', label: t('nav_knowledge_base'), icon: BookOpen,        roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR'] },
    { href: '/dialog-reviews', label: t('nav_dialog_reviews'), icon: MessageSquare,   roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/monitoring',     label: t('nav_monitoring'),      icon: Activity,        roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/incidents',      label: t('nav_incidents'),       icon: AlertTriangle,   roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/reports',        label: t('nav_reports'),         icon: BarChart3,       roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/users',          label: t('nav_users'),           icon: Users,           roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/products',       label: t('nav_products'),        icon: Package,         roles: ['ADMIN', 'TEAM_LEADER'] },
    { href: '/settings',       label: t('nav_settings'),        icon: Settings,        roles: ['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER'] },
  ];

  const filtered = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40 sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Hippo Support</p>
          <p className="text-xs text-slate-500">Control Center</p>
        </div>
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
  );
}
