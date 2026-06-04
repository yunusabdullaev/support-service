'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ImprovementRequest } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Plus, Lightbulb, Users, TrendingUp, UserPlus, Check, Download } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function ImprovementsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);

    const token = localStorage.getItem('token');
    if (token) params.set('token', token);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${API_URL}/improvements/export/excel?${params.toString()}`, '_blank');
  };

  const { data: improvements = [], isLoading } = useQuery<ImprovementRequest[]>({
    queryKey: ['improvements', statusFilter, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      return api.get(`/improvements?${params.toString()}`).then(r => r.data);
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/improvements/${id}/upvote`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['improvements'] });
      // Show checkmark feedback briefly
      setJustUpvoted(id);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const statuses = ['NEW', 'UNDER_REVIEW', 'PLANNED', 'IN_DEVELOPMENT', 'DONE', 'REJECTED'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('improvements_title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{improvements.length} {t('requests')}</p>
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
            <Link
              href="/improvements/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> {t('new_improvement')}
            </Link>
          </div>
        </div>

        {/* Filters bar */}
        <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                !statusFilter ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t('all')}
            </button>
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-600 text-xs">-</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : improvements.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center h-48 text-slate-500">
              <Lightbulb className="w-8 h-8 mb-2" />
              <p>{t('no_improvements')}</p>
            </div>
          ) : (
            improvements.map(imp => {
              const isUpvoted = justUpvoted === imp.id;
              const isUpvoting = upvoteMutation.isPending && upvoteMutation.variables === imp.id;

              return (
                <div key={imp.id} className="glass-card p-5 hover:border-slate-600 transition-all duration-200">
                  <div className="flex items-start gap-4">

                    {/* +1 Client button */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => upvoteMutation.mutate(imp.id)}
                        disabled={isUpvoting}
                        title={t('add_client_title')}
                        className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 font-bold transition-all duration-200 ${
                          isUpvoted
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-95'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-indigo-500/20 hover:border-indigo-500 hover:text-indigo-400 hover:scale-105'
                        }`}
                      >
                        {isUpvoted ? (
                          <Check className="w-5 h-5" />
                        ) : isUpvoting ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span className="text-[10px] font-semibold">+1</span>
                          </>
                        )}
                      </button>
                      <span className={`text-lg font-bold tabular-nums transition-colors ${
                        isUpvoted ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {imp.requestedByClientsCount}
                      </span>
                      <span className="text-[10px] text-slate-600">{t('clients')}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StatusBadge status={imp.status} />
                        {imp.product && (
                          <span className="text-xs text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                            {imp.product.name}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1">{imp.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{imp.description}</p>
                      {imp.businessValue && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          {imp.businessValue}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-2">{formatDate(imp.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
