'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Difficulty, DifficultyStatus, Product } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  Plus, Frown, X, Package, User, Calendar,
  ChevronRight, CircleDot, CheckCircle2, Eye, Clock
} from 'lucide-react';
import Link from 'next/link';

const STATUS_ICONS: Record<DifficultyStatus, React.ReactNode> = {
  NEW: <CircleDot className="w-4 h-4 text-blue-400" />,
  UNDER_REVIEW: <Eye className="w-4 h-4 text-yellow-400" />,
  RESOLVED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  REJECTED: <X className="w-4 h-4 text-red-400" />,
};

const STATUS_COLORS_MAP: Record<DifficultyStatus, string> = {
  NEW: 'border-l-blue-500',
  UNDER_REVIEW: 'border-l-yellow-500',
  RESOLVED: 'border-l-emerald-500',
  REJECTED: 'border-l-red-500',
};

export default function DifficultiesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [newStatus, setNewStatus] = useState<DifficultyStatus | ''>('');

  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER' || user?.role === 'DEVELOPER';
  const canDelete = user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER';

  const { data: difficulties = [], isLoading } = useQuery<Difficulty[]>({
    queryKey: ['difficulties', statusFilter, productFilter, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (productFilter) params.set('productId', productFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      return api.get(`/difficulties?${params.toString()}`).then(r => r.data);
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DifficultyStatus }) =>
      api.patch(`/difficulties/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setSelected(null);
      setNewStatus('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/difficulties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setSelected(null);
    },
  });

  const statuses: DifficultyStatus[] = ['NEW', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

  const statsCount = {
    all: difficulties.length,
    NEW: difficulties.filter(d => d.status === 'NEW').length,
    UNDER_REVIEW: difficulties.filter(d => d.status === 'UNDER_REVIEW').length,
    RESOLVED: difficulties.filter(d => d.status === 'RESOLVED').length,
    REJECTED: difficulties.filter(d => d.status === 'REJECTED').length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Frown className="w-6 h-6 text-amber-400" />
              {t('difficulties_title')}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {difficulties.length} {t('difficulties_count')} — {t('difficulties_subtitle')}
            </p>
          </div>
          <Link
            href="/difficulties/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-900/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {t('new_difficulty')}
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'NEW', color: 'blue', count: statsCount.NEW, icon: <CircleDot className="w-4 h-4" /> },
            { label: 'UNDER_REVIEW', color: 'yellow', count: statsCount.UNDER_REVIEW, icon: <Eye className="w-4 h-4" /> },
            { label: 'RESOLVED', color: 'emerald', count: statsCount.RESOLVED, icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: 'REJECTED', color: 'red', count: statsCount.REJECTED, icon: <X className="w-4 h-4" /> },
          ].map(({ label, color, count, icon }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(statusFilter === label ? '' : label)}
              className={`glass-card p-3 flex items-center gap-3 text-left transition-all hover:border-slate-600 ${statusFilter === label ? `border-${color}-500/50 bg-${color}-500/5` : ''}`}
            >
              <span className={`text-${color}-400`}>{icon}</span>
              <div>
                <p className={`text-lg font-bold text-${color}-400`}>{count}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{label.replace(/_/g, ' ')}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters bar */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap flex-1">
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
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {STATUS_ICONS[s]}
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Product filter */}
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">{t('all')} ({t('product')})</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Date range */}
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-600 text-xs">–</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : difficulties.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center h-48 text-slate-500">
              <Frown className="w-10 h-10 mb-3 text-slate-600" />
              <p className="font-medium">{t('no_difficulties')}</p>
              <p className="text-xs mt-1 text-slate-600">
                <Link href="/difficulties/new" className="text-indigo-400 hover:underline">
                  {t('new_difficulty')}
                </Link>
              </p>
            </div>
          ) : (
            difficulties.map(d => (
              <button
                key={d.id}
                onClick={() => { setSelected(d); setNewStatus(''); }}
                className={`w-full glass-card p-4 hover:border-slate-600 transition-all duration-200 border-l-4 text-left group ${STATUS_COLORS_MAP[d.status]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <StatusBadge status={d.status} />
                      {d.product && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          <Package className="w-3 h-3" />
                          {d.product.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{d.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{d.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {d.createdBy && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-600">
                          <User className="w-3 h-3" />
                          {d.createdBy.fullName}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Calendar className="w-3 h-3" />
                        {formatDate(d.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Drawer/Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={selected.status} />
                    {selected.product && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                        <Package className="w-3 h-3" />
                        {selected.product.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white leading-snug">{selected.title}</h2>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
              </div>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {selected.createdBy && (
                  <div className="bg-slate-800/40 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('reported_by')}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                        {selected.createdBy.fullName.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{selected.createdBy.fullName}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-0.5">{selected.createdBy.role}</p>
                  </div>
                )}
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('created')}</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-300">{formatDate(selected.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Status update — only for allowed roles */}
              {canUpdateStatus && selected.status !== 'RESOLVED' && selected.status !== 'REJECTED' && (
                <div className="border-t border-slate-800 pt-4 mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {t('difficulty_status_update')}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {statuses
                      .filter(s => s !== selected.status)
                      .map(s => (
                        <button
                          key={s}
                          onClick={() => setNewStatus(newStatus === s ? '' : s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            newStatus === s
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {STATUS_ICONS[s]}
                          {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                  </div>
                  {newStatus && (
                    <button
                      onClick={() => updateMutation.mutate({ id: selected.id, status: newStatus as DifficultyStatus })}
                      disabled={updateMutation.isPending}
                      className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {updateMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>{t('save')}</>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Delete button */}
              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm(t('delete') + '?')) deleteMutation.mutate(selected.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  {t('delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
