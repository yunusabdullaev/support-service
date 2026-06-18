'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ImprovementRequest, ImprovementStatus, Product } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { ProductBadge } from '@/components/ProductBadge';
import { formatDate, playNotificationSound } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useProduct } from '@/lib/product';
import {
  Plus, Lightbulb, TrendingUp, UserPlus, Check,
  Download, Edit3, Trash2, X, Save, AlertCircle, Phone, User, Clock, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { UndoToast } from '@/components/ui/UndoToast';
import { useAuth } from '@/lib/auth';

export default function ImprovementsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { selectedProductId: productFilter } = useProduct();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ImprovementRequest | null>(null);
  const [detailItem, setDetailItem] = useState<ImprovementRequest | null>(null);
  const [upvoteTarget, setUpvoteTarget] = useState<string | null>(null);
  const [upvotePhone, setUpvotePhone] = useState('');
  const [undoUpvoteId, setUndoUpvoteId] = useState<string | null>(null);



  useEffect(() => {
    if (detailItem) {
      localStorage.setItem(`viewed_improvement_${detailItem.id}`, new Date().toISOString());
    }
  }, [detailItem]);

  const isImprovementUpdated = (item: ImprovementRequest) => {
    if (typeof window === 'undefined') return false;
    const lastViewed = localStorage.getItem(`viewed_improvement_${item.id}`);
    if (!lastViewed) {
      const ageMs = Date.now() - new Date(item.createdAt).getTime();
      return ageMs < 48 * 60 * 60 * 1000;
    }
    return new Date(item.updatedAt).getTime() > new Date(lastViewed).getTime() + 1000;
  };

  const canViewDetail = ['ADMIN', 'TEAM_LEADER', 'DEVELOPER'].includes(user?.role || '');

  const canEditItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const canDeleteItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

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

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const { data: improvements = [], isLoading } = useQuery<ImprovementRequest[]>({
    queryKey: ['improvements', productFilter, statusFilter, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (productFilter) params.set('productId', productFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      return api.get(`/improvements?${params.toString()}`).then(r => r.data);
    },
    refetchInterval: 5000,
  });

  const prevDataRef = useRef<{ count: number; statusHash: string } | null>(null);

  useEffect(() => {
    if (isLoading || !improvements.length) return;

    const count = improvements.length;
    const statusHash = improvements.map(imp => `${imp.id}-${imp.status}`).join('|');

    if (prevDataRef.current !== null) {
      const prev = prevDataRef.current;
      if (count > prev.count || statusHash !== prev.statusHash) {
        playNotificationSound();
      }
    }

    prevDataRef.current = { count, statusHash };
  }, [improvements, isLoading]);

  const upvoteMutation = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      api.post(`/improvements/${id}/upvote`, { phone }),
    onSuccess: (data, { id }) => {
      qc.invalidateQueries({ queryKey: ['improvements'] });
      setJustUpvoted(id);
      setUpvoteTarget(null);
      setUpvotePhone('');
      setUndoUpvoteId(data.data?.id || null);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const undoUpvoteMutation = useMutation({
    mutationFn: (upvoteId: string) => api.delete(`/improvements/upvotes/${upvoteId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['improvements'] });
      setUndoUpvoteId(null);
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
          <div className="flex items-center gap-2">
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
              const isUpvoting = upvoteMutation.isPending && upvoteMutation.variables?.id === imp.id;

              return (
                <div key={imp.id} className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/70 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group">
                  <div className="flex items-start gap-4">
                    {/* +1 Client button */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button
                      onClick={() => setUpvoteTarget(imp.id)}
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

                    {/* Clickable content area for detail view */}
                    <div
                      className={`flex-1 min-w-0 ${canViewDetail ? 'cursor-pointer' : ''}`}
                      onClick={() => canViewDetail && setDetailItem(imp)}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StatusBadge status={imp.status} />
                        {imp.product && <ProductBadge name={imp.product.name} />}
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2 flex-wrap">
                        {imp.title}
                        {isImprovementUpdated(imp) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {t('updated_at')}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2">{imp.description}</p>
                      {imp.businessValue && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                          {imp.businessValue}
                        </p>
                      )}
                      {imp.clientPhone && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          {imp.clientPhone}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {imp.createdBy && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-600">
                            <User className="w-3 h-3" />
                            {imp.createdBy.fullName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-600">{formatDate(imp.createdAt)}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canViewDetail && (
                        <button
                          onClick={() => setDetailItem(imp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                          title="Batafsil ko'rish"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
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

      {/* Upvote Phone Modal */}
      {upvoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Mijoz telefon raqami</h3>
                <p className="text-xs text-slate-400 mt-0.5">Qaysi mijoz bu taklifni yubordi?</p>
              </div>
              <button onClick={() => { setUpvoteTarget(null); setUpvotePhone(''); }} className="ml-auto p-1 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="tel"
              value={upvotePhone}
              onChange={e => setUpvotePhone(e.target.value)}
              placeholder="+998 90 000 00 00"
              autoFocus
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-4"
              onKeyDown={e => e.key === 'Enter' && upvotePhone && upvoteMutation.mutate({ id: upvoteTarget, phone: upvotePhone })}
            />
            <div className="flex gap-3">
              <button onClick={() => { setUpvoteTarget(null); setUpvotePhone(''); }} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                {t('cancel')}
              </button>
              <button
                onClick={() => upvoteMutation.mutate({ id: upvoteTarget, phone: upvotePhone })}
                disabled={!upvotePhone || upvoteMutation.isPending}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {upvoteMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                +1 Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailItem && canViewDetail && (
        <DetailDrawer
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onEdit={() => { setEditItem(detailItem); setDetailItem(null); }}
          onDelete={() => { setDeleteId(detailItem.id); setDetailItem(null); }}
          canEdit={canEditItem(detailItem.createdBy?.id)}
          canDelete={canDeleteItem(detailItem.createdBy?.id)}
        />
      )}

      {/* Undo Toast */}
      {undoUpvoteId && (
        <UndoToast
          message="+1 qo'shildi"
          onUndo={() => undoUpvoteMutation.mutate(undoUpvoteId)}
          onDismiss={() => setUndoUpvoteId(null)}
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
    productId: item.productId || item.product?.id || '',
    description: item.description,
    source: item.source || '',
    clientPhone: item.clientPhone || '',
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
            <label className="block text-xs text-slate-400 mb-1">{t('product') || 'Mahsulot'} *</label>
            <select value={form.productId} onChange={e => set('productId', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="" disabled>{t('select_product') || 'Mahsulot tanlang'}</option>
              {products.filter(p => p.isActive).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
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
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Phone className="w-3 h-3" />{t('client_phone')}
            </label>
            <input type="tel" value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
              placeholder="+998 90 000 00 00"
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

function DetailDrawer({ item, onClose, onEdit, onDelete, canEdit, canDelete }: {
  item: ImprovementRequest;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { t } = useI18n();
  const { data: detail } = useQuery<ImprovementRequest>({
    queryKey: ['improvement-detail', item.id],
    queryFn: () => api.get(`/improvements/${item.id}`).then(r => r.data),
  });

  const upvotes = detail?.upvotes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <StatusBadge status={item.status} />
                {item.product && <ProductBadge name={item.product.name} />}
              </div>
              <h2 className="text-base font-bold text-white leading-snug">{item.title}</h2>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && <button onClick={onEdit} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors"><Edit3 className="w-4 h-4" /></button>}
              <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-5">
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{item.description}</p>
          </div>

          {/* Images */}
          {item.images && item.images.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Rasmlar</p>
              <div className="grid grid-cols-2 gap-2">
                {item.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-800 block hover:border-indigo-500 transition-colors">
                    <img src={img} alt={`Rasm ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {item.createdBy && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Hodim</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">
                    {item.createdBy.fullName.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{item.createdBy.fullName}</span>
                </div>
              </div>
            )}
            <div className="bg-slate-800/40 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('created')}</p>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-300">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            {item.clientPhone && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Mijoz tel</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span className="text-xs text-slate-300">{item.clientPhone}</span>
                </div>
              </div>
            )}
            {item.businessValue && (
              <div className="bg-slate-800/40 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Business value</p>
                <p className="text-xs text-slate-300">{item.businessValue}</p>
              </div>
            )}
          </div>

          {/* Upvote history */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mijozlar tarixi
              </p>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                {upvotes.length} ta
              </span>
            </div>
            {upvotes.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Hali hech kim +1 bosmagan</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {upvotes.map((uv, i) => (
                  <div key={uv.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2">
                    <span className="text-[10px] text-slate-600 w-5">{i + 1}</span>
                    <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="text-xs text-slate-300 font-medium flex-1">{uv.phone}</span>
                    <span className="text-[10px] text-slate-600">{formatDate(uv.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          {canDelete && (
            <button onClick={onDelete} className="mt-4 w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
              {t('delete')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
