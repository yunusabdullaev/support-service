import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'ru-RU') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONFIRMED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  WAITING: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  FIXED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CLOSED: 'bg-slate-600/20 text-slate-500 border-slate-600/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  OPEN: 'bg-red-500/20 text-red-400 border-red-500/30',
  INVESTIGATING: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  RESOLVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  REVIEWED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  NEEDS_TRAINING: 'bg-red-500/20 text-red-400 border-red-500/30',
  PUBLISHED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ARCHIVED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  PLANNED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_DEVELOPMENT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DONE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const SERVICE_STATUS_COLORS: Record<string, string> = {
  ONLINE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  DEGRADED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  OFFLINE: 'bg-red-500/20 text-red-400 border-red-500/30',
  UNKNOWN: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  TEAM_LEADER: 'Team Leader',
  OPERATOR: 'Operator',
  DEVELOPER: 'Developer',
};
