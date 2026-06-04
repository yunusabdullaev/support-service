'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, BugStatus, BugPriority } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { Plus, Search, Clock, Bug as BugIcon, Download, UserPlus, Check } from 'lucide-react';
import Link from 'next/link';

export default function BugsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<BugPriority | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);

  const qc = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bugs/${id}/upvote`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setJustUpvoted(id);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (search) params.set('search', search);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    const token = localStorage.getItem('token');
    if (token) params.set('token', token);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${API_URL}/reports/export/excel?${params.toString()}`, '_blank');
  };

  const { data: bugs = [], isLoading } = useQuery<Bug[]>({
    queryKey: ['bugs', statusFilter, priorityFilter, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      return api.get(`/bugs?${params}`).then(r => r.data);
    },
  });

  const filtered = bugs.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()));
  const bugStatuses: BugStatus[] = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'WAITING', 'FIXED', 'CLOSED', 'REJECTED'];
  const bugPriorities: BugPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('bug_tracker')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{bugs.length} {t('total_bugs')}</p>
          </div>
          <div className="flex gap-2">
            {(user?.role === 'TEAM_LEADER' || user?.role === 'ADMIN') && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-950/20"
              >
                <Download className="w-4 h-4" /> {t('export_excel')}
              </button>
            )}
            <Link href="/bugs/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> {t('new_bug')}
            </Link>
          </div>
        </div>

        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as BugStatus | '')}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{t('all_statuses')}</option>
            {bugStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as BugPriority | '')}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{t('all_priorities')}</option>
            {bugPriorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-600 text-xs">-</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <BugIcon className="w-8 h-8 mb-2" />
              <p>{t('no_bugs')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {[t('bug_title'), t('clients'), t('product'), t('priority'), t('status'), t('assigned_to'), t('created')].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(bug => (
                    <tr key={bug.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 max-w-xs">
                        <Link href={`/bugs/${bug.id}`} className="group block">
                          <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">{bug.title}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {bug.module && <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded">{bug.module}</span>}
                            <span className="text-xs text-slate-400 line-clamp-1 flex-1">{bug.description}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold tabular-nums transition-colors ${
                            justUpvoted === bug.id ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {bug.reportedByClientsCount}
                          </span>
                          <button
                            onClick={() => upvoteMutation.mutate(bug.id)}
                            disabled={upvoteMutation.isPending && upvoteMutation.variables === bug.id}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border font-bold transition-all duration-200 ${
                              justUpvoted === bug.id
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-95'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-indigo-500/20 hover:border-indigo-500 hover:text-indigo-400 hover:scale-105'
                            }`}
                          >
                            {justUpvoted === bug.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : upvoteMutation.isPending && upvoteMutation.variables === bug.id ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-[10px] font-extrabold">+1</span>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{bug.product?.name}</td>
                      <td className="px-5 py-4"><PriorityBadge priority={bug.priority} /></td>
                      <td className="px-5 py-4"><StatusBadge status={bug.status} /></td>
                      <td className="px-5 py-4">
                        {bug.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white">
                              {bug.assignedTo.fullName.charAt(0)}
                            </div>
                            <span className="text-xs text-slate-400">{bug.assignedTo.fullName}</span>
                          </div>
                        ) : <span className="text-xs text-slate-600">{t('unassigned')}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />{formatDate(bug.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
