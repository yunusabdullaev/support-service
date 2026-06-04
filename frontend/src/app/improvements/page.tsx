'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ImprovementRequest, ImprovementStatus, Product } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  Plus, Lightbulb, TrendingUp, UserPlus, Check,
  Download, Edit3, Trash2, X, Save, AlertCircle
} from 'lucide-react';
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ImprovementRequest | null>(null);

  const canEditItem = (createdById?: string) =>
    ['ADMIN', 'TEAM_LEADER', 'DEVELOPER'].includes(user?.role || '') || user?.id === createdById;

  const canDeleteItem = (createdById?: string) =>
    ['ADMIN', 'TEAM_LEADER'].includes(user?.role || '') || user?.id === createdById;

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
      setJustUpvoted(id);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/improvements/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['improvements'] }); setDeleteId(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/improvements/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['improvements'] }); setEditItem(null); },
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!statusFilter ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {t('all')}
            </button>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
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
                <div key={imp.id} className="glass-card p-5 hover:border-slate-600 transition-all duration-200 group">
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
                      <span className={`text-lg font-bold tabular-nums transition-colors ${isUpvoted ? 'text-emerald-400' : 'text-slate-300'}`}>
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

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canEditItem(imp.createdBy?.id) && (
                        <button
                          onClick={() => setEditItem(imp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                          title={t('edit')}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteItem(imp.createdBy?.id) && (
                        <button
                          onClick={() => setDeleteId(imp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t('confirm_delete')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('delete')}?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                {t('cancel')}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditImprovementModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(data) => updateMutation.mutate({ id: editItem.id, data })}
          isPending={updateMutation.isPending}
        />
      )}
    </AppLayout>
  );
}

function EditImprovementModal({ item, onClose, onSave, isPending }: {
  item: ImprovementRequest;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const improvementStatuses: ImprovementStatus[] = ['NEW', 'UNDER_REVIEW', 'PLANNED', 'IN_DEVELOPMENT', 'DONE', 'REJECTED'];

  const [form, setForm] = useState({
    title: item.title,
    description: item.description,
    source: item.source || '',
    businessValue: item.businessValue || '',
    status: item.status,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">{t('edit')} — {t('improvements_title')}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('improvement_title')} *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('status')}</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {improvementStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('description')} *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('source') || 'Manba'}</label>
            <input value={form.source} onChange={e => set('source', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Business value</label>
            <textarea value={form.businessValue} onChange={e => set('businessValue', e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">{t('cancel')}</button>
            <button
              onClick={() => onSave(form)}
              disabled={isPending}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />{t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
