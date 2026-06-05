'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Difficulty, DifficultyStatus, Product } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { ProductBadge } from '@/components/ProductBadge';
import { formatDate, playNotificationSound } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  Plus, Frown, X, Package, User, Calendar,
  ChevronRight, CircleDot, CheckCircle2, Eye, Clock,
  Edit3, Trash2, Save, AlertCircle, Check, Phone
} from 'lucide-react';
import Link from 'next/link';
import { UndoToast } from '@/components/ui/UndoToast';

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



  useEffect(() => {
    if (selected) {
      localStorage.setItem(`viewed_difficulty_${selected.id}`, new Date().toISOString());
    }
  }, [selected]);

  const isDifficultyUpdated = (item: Difficulty) => {
    if (typeof window === 'undefined') return false;
    const lastViewed = localStorage.getItem(`viewed_difficulty_${item.id}`);
    if (!lastViewed) {
      const ageMs = Date.now() - new Date(item.createdAt).getTime();
      return ageMs < 48 * 60 * 60 * 1000;
    }
    return new Date(item.updatedAt).getTime() > new Date(lastViewed).getTime() + 1000;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', productId: '', clientPhone: '', description: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);

  const canUpdateStatus = user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER' || user?.role === 'DEVELOPER';
  const canEditItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const canDeleteItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

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
    refetchInterval: 5000,
  });

  const prevDataRef = useRef<{ count: number; statusHash: string } | null>(null);

  useEffect(() => {
    if (isLoading || !difficulties.length) return;

    const count = difficulties.length;
    const statusHash = difficulties.map(d => `${d.id}-${d.status}`).join('|');

    if (prevDataRef.current !== null) {
      const prev = prevDataRef.current;
      if (count > prev.count || statusHash !== prev.statusHash) {
        playNotificationSound();
      }
    }

    prevDataRef.current = { count, statusHash };
  }, [difficulties, isLoading]);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/difficulties/${id}/upvote`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setJustUpvoted(id);
      setUndoId(id);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/difficulties/${id}/downvote`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setUndoId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/difficulties/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setSelected(null);
      setIsEditing(false);
      setNewStatus('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/difficulties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      setSelected(null);
      setDeleteId(null);
    },
  });

  const openDetail = (d: Difficulty) => {
    setSelected(d);
    setIsEditing(false);
    setNewStatus('');
    setEditForm({ title: d.title, productId: d.productId || '', clientPhone: d.clientPhone || '', description: d.description });
  };

  const statuses: DifficultyStatus[] = ['NEW', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

  const statsCount = {
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!statusFilter ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {t('all')}
            </button>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {STATUS_ICONS[s]}
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">{t('all')} ({t('product')})</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-600 text-xs">–</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
                <Link href="/difficulties/new" className="text-indigo-400 hover:underline">{t('new_difficulty')}</Link>
              </p>
            </div>
          ) : (
            difficulties.map(d => (
              <div key={d.id} className={`glass-card p-4 hover:border-slate-600 transition-all duration-200 border-l-4 group ${STATUS_COLORS_MAP[d.status]}`}>
                <div className="flex items-start justify-between gap-3">
                  {/* +1 upvote button */}
                  <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => upvoteMutation.mutate(d.id)}
                      disabled={upvoteMutation.isPending && upvoteMutation.variables === d.id}
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 font-bold transition-all duration-200 ${
                        justUpvoted === d.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-95'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-amber-500/20 hover:border-amber-500 hover:text-amber-400 hover:scale-105'
                      }`}
                    >
                      {justUpvoted === d.id ? (
                        <Check className="w-4 h-4" />
                      ) : upvoteMutation.isPending && upvoteMutation.variables === d.id ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Frown className="w-3.5 h-3.5" /><span className="text-[9px] font-extrabold">+1</span></>
                      )}
                    </button>
                    <span className={`text-sm font-bold tabular-nums transition-colors ${
                      justUpvoted === d.id ? 'text-emerald-400' : 'text-slate-400'
                    }`}>{d.reportedByCount}</span>
                  </div>
                  <button onClick={() => openDetail(d)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <StatusBadge status={d.status} />
                      {d.product && <ProductBadge name={d.product.name} size="xs" />}
                      {d.clientPhone && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          📞 +{d.clientPhone}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1 flex items-center gap-2 flex-wrap">
                      {d.title}
                      {isDifficultyUpdated(d) && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t('updated_at')}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{d.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {d.createdBy && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-600">
                          <User className="w-3 h-3" />{d.createdBy.fullName}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-600">
                        <Calendar className="w-3 h-3" />{formatDate(d.createdAt)}
                      </span>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditItem(d.createdBy?.id) && (
                      <button
                        onClick={() => { openDetail(d); setTimeout(() => setIsEditing(true), 0); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                        title={t('edit')}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDeleteItem(d.createdBy?.id) && (
                      <button
                        onClick={() => setDeleteId(d.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-1" />
                  </div>
                </div>
              </div>
            ))
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

      {/* Detail / Edit Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) { setSelected(null); setIsEditing(false); } }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-12 h-1 bg-slate-700 rounded-full" />
            </div>
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex-1">
                  {!isEditing && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge status={selected.status} />
                        {selected.product && <ProductBadge name={selected.product.name} />}
                      </div>
                      <h2 className="text-lg font-bold text-white leading-snug">{selected.title}</h2>
                    </>
                  )}
                  {isEditing && (
                    <h2 className="text-base font-bold text-white">{t('edit')} — {t('difficulties_title')}</h2>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {canEditItem(selected.createdBy?.id) && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors"
                      title={t('edit')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelected(null); setIsEditing(false); }}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('difficulty_title_label')} *</label>
                    <input
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('product')}</label>
                    <select
                      value={editForm.productId}
                      onChange={e => setEditForm(f => ({ ...f, productId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">{t('select_product')}</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('client_phone') || 'Mijoz telefoni'}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1.5 text-slate-500 text-sm font-mono">+</span>
                      <input
                        type="tel"
                        value={editForm.clientPhone}
                        onChange={e => setEditForm(f => ({ ...f, clientPhone: e.target.value.replace(/\D/g, '') }))}
                        placeholder="998901234567"
                        className="w-full pl-6 pr-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('description')} *</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={5}
                      className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                      {t('cancel')}
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ id: selected.id, data: { title: editForm.title, productId: editForm.productId || null, clientPhone: editForm.clientPhone || null, description: editForm.description } })}
                      disabled={updateMutation.isPending}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />{t('save')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Description */}
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                    {selected.clientPhone && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{t('client_phone') || 'Mijoz telefoni'}:</span>
                        <a href={`tel:+${selected.clientPhone}`} className="font-mono text-emerald-400 hover:underline flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> +{selected.clientPhone}
                        </a>
                      </div>
                    )}
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

                  {/* Status update */}
                  {canUpdateStatus && selected.status !== 'RESOLVED' && selected.status !== 'REJECTED' && (
                    <div className="border-t border-slate-800 pt-4 mb-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('difficulty_status_update')}</p>
                      <div className="flex gap-2 flex-wrap">
                        {statuses.filter(s => s !== selected.status).map(s => (
                          <button key={s} onClick={() => setNewStatus(newStatus === s ? '' : s)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${newStatus === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                          >
                            {STATUS_ICONS[s]}{s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                      {newStatus && (
                        <button
                          onClick={() => updateMutation.mutate({ id: selected.id, data: { status: newStatus } })}
                          disabled={updateMutation.isPending}
                          className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {updateMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('save')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Delete button */}
                  {canDeleteItem(selected.createdBy?.id) && (
                    <button
                      onClick={() => setDeleteId(selected.id)}
                      className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      {t('delete')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoId && (
        <UndoToast
          message="+1 qo'shildi"
          onUndo={() => downvoteMutation.mutate(undoId)}
          onDismiss={() => setUndoId(null)}
        />
      )}
    </AppLayout>
  );
}
