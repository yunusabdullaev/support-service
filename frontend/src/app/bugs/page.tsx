'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, BugStatus, BugPriority, Product } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { ProductBadge } from '@/components/ProductBadge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  Plus, Search, Clock, Bug as BugIcon, Download,
  UserPlus, Check, Edit3, Trash2, X, AlertCircle, Save
} from 'lucide-react';
import Link from 'next/link';
import { UndoToast } from '@/components/ui/UndoToast';

export default function BugsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<BugPriority | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editBug, setEditBug] = useState<Bug | null>(null);

  const qc = useQueryClient();

  const canEditItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const canDeleteItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const upvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bugs/${id}/upvote`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setJustUpvoted(id);
      setUndoId(id);
      setTimeout(() => setJustUpvoted(null), 1500);
    },
  });

  const downvoteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bugs/${id}/downvote`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setUndoId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bugs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs'] }); setDeleteId(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/bugs/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bugs'] }); setEditBug(null); },
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

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const { data: bugs = [], isLoading } = useQuery<Bug[]>({
    queryKey: ['bugs', productFilter, statusFilter, priorityFilter, fromDate, toDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (productFilter) params.set('productId', productFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      return api.get(`/bugs?${params}`).then(r => r.data);
    },
    refetchInterval: 5000,
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
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Barcha mahsulotlar</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
                    {[t('bug_title'), t('clients'), t('product'), t('priority'), t('status'), t('assigned_to'), t('created'), ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(bug => (
                    <tr key={bug.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-4">
                        <Link href={`/bugs/${bug.id}`} className="group/link block">
                          <p className="text-sm font-medium text-slate-200 group-hover/link:text-indigo-400 transition-colors">{bug.title}</p>
                          <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 mt-0.5">
                            {bug.module && <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded flex-shrink-0">{bug.module}</span>}
                            {bug.clientPhone && <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex-shrink-0">+{bug.clientPhone}</span>}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{bug.description}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold tabular-nums transition-colors ${justUpvoted === bug.id ? 'text-emerald-400' : 'text-slate-300'}`}>
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
                      <td className="px-5 py-4">{bug.product && <ProductBadge name={bug.product.name} />}</td>
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
                      {/* Action buttons */}
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEditItem(bug.createdBy?.id) && (
                            <button
                              onClick={() => setEditBug(bug)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                              title={t('edit')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteItem(bug.createdBy?.id) && (
                            <button
                              onClick={() => setDeleteId(bug.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title={t('delete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Edit Bug Modal */}
      {editBug && (
        <EditBugModal
          bug={editBug}
          onClose={() => setEditBug(null)}
          onSave={(data) => updateMutation.mutate({ id: editBug.id, data })}
          isPending={updateMutation.isPending}
        />
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

function EditBugModal({ bug, onClose, onSave, isPending }: {
  bug: Bug;
  onClose: () => void;
  onSave: (data: any) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const bugStatuses: BugStatus[] = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'WAITING', 'FIXED', 'CLOSED', 'REJECTED'];
  const bugPriorities: BugPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const [form, setForm] = useState({
    title: bug.title,
    productId: bug.productId || '',
    module: bug.module || '',
    description: bug.description,
    priority: bug.priority,
    status: bug.status,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">{t('edit')} — Bug</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('bug_title')} *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('product')}</label>
              <select value={form.productId} onChange={e => set('productId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">{t('select_product')}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('module')}</label>
              <input value={form.module} onChange={e => set('module', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('priority')}</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {bugPriorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {bugStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t('description')} *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
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
