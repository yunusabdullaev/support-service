'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, BugStatus, BugPriority, Product } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { ProductBadge } from '@/components/ProductBadge';
import { formatDate, playNotificationSound } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useProduct } from '@/lib/product';
import {
  Plus, Search, Clock, Bug as BugIcon, Download,
  UserPlus, Check, Edit3, Trash2, X, AlertCircle, Save, MessageSquare, Phone,
  LayoutGrid, List, User
} from 'lucide-react';
import Link from 'next/link';
import { UndoToast } from '@/components/ui/UndoToast';

export default function BugsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { selectedProductId: productFilter } = useProduct();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<BugPriority | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [justUpvoted, setJustUpvoted] = useState<string | null>(null);
  const [upvoteTarget, setUpvoteTarget] = useState<string | null>(null);
  const [upvotePhone, setUpvotePhone] = useState('');
  const [undoId, setUndoId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editBug, setEditBug] = useState<Bug | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [userFilter, setUserFilter] = useState('');

  const qc = useQueryClient();

  const isBugUpdated = (bug: Bug) => {
    if (typeof window === 'undefined') return false;
    const lastViewed = localStorage.getItem(`viewed_bug_${bug.id}`);
    if (!lastViewed) {
      const ageMs = Date.now() - new Date(bug.createdAt).getTime();
      return ageMs < 48 * 60 * 60 * 1000;
    }
    return new Date(bug.updatedAt).getTime() > new Date(lastViewed).getTime() + 1000;
  };

  const canEditItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const canDeleteItem = (createdById?: string) =>
    user?.role === 'TEAM_LEADER' || user?.id === createdById;

  const upvoteMutation = useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) => api.post(`/bugs/${id}/upvote`, { phone }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setJustUpvoted(id);
      setUndoId(id);
      setUpvoteTarget(null);
      setUpvotePhone('');
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

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
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

  const prevDataRef = useRef<{ bugCount: number; commentCount: number; statusHash: string } | null>(null);

  useEffect(() => {
    if (isLoading || !bugs.length) return;

    const bugCount = bugs.length;
    const commentCount = bugs.reduce((sum, b) => sum + (b._count?.comments || 0), 0);
    const statusHash = bugs.map(b => `${b.id}-${b.status}`).join('|');

    if (prevDataRef.current !== null) {
      const prev = prevDataRef.current;
      if (bugCount > prev.bugCount || commentCount > prev.commentCount || statusHash !== prev.statusHash) {
        playNotificationSound();
      }
    }

    prevDataRef.current = { bugCount, commentCount, statusHash };
  }, [bugs, isLoading]);

  const filtered = bugs
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()))
    .filter(b => !userFilter || b.createdBy?.id === userFilter)
    .sort((a, b) => {
      const closedStatuses = ['CLOSED', 'REJECTED'];
      const aIsClosed = closedStatuses.includes(a.status) ? 1 : 0;
      const bIsClosed = closedStatuses.includes(b.status) ? 1 : 0;
      return aIsClosed - bIsClosed;
    });
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
            {/* View toggle */}
            <div className="flex bg-slate-800/60 rounded-lg border border-slate-700 p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Ro'yxat"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                title="Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
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
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Barcha hodimlar</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-600 text-xs">-</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && !isLoading && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {bugStatuses.map(status => {
                const statusBugs = filtered.filter(b => b.status === status);
                const STATUS_COLORS: Record<string, string> = {
                  NEW: 'border-t-blue-500',
                  CONFIRMED: 'border-t-cyan-500',
                  IN_PROGRESS: 'border-t-amber-500',
                  WAITING: 'border-t-orange-500',
                  FIXED: 'border-t-emerald-500',
                  CLOSED: 'border-t-slate-500',
                  REJECTED: 'border-t-red-500',
                };
                const STATUS_LABELS: Record<string, string> = {
                  NEW: 'Yangi',
                  CONFIRMED: 'Tasdiqlangan',
                  IN_PROGRESS: 'Jarayonda',
                  WAITING: 'Kutmoqda',
                  FIXED: 'Tuzatildi',
                  CLOSED: 'Yopildi',
                  REJECTED: 'Rad etildi',
                };
                return (
                  <div key={status} className={`w-60 sm:w-72 flex-shrink-0 glass-card rounded-xl border-t-2 ${STATUS_COLORS[status] || 'border-t-slate-600'}`}>
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        {STATUS_LABELS[status] || status}
                      </h3>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                        {statusBugs.length}
                      </span>
                    </div>
                    <div className="p-2 space-y-2 max-h-[65vh] overflow-y-auto">
                      {statusBugs.length === 0 && (
                        <p className="text-xs text-slate-600 text-center py-4">Bo'sh</p>
                      )}
                      {statusBugs.map(bug => (
                        <Link
                          key={bug.id}
                          href={`/bugs/${bug.id}`}
                          className="block p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-lg border border-slate-700/50 hover:border-indigo-500/40 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <PriorityBadge priority={bug.priority} />
                            {bug.product && <ProductBadge name={bug.product.name} />}
                          </div>
                          <p className="text-sm text-slate-200 font-medium leading-tight group-hover:text-white transition-colors line-clamp-2">
                            {bug.title}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-500">
                              {bug.createdBy?.fullName}
                            </span>
                            <div className="flex items-center gap-2">
                              {(bug._count?.comments || 0) > 0 && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                  <MessageSquare className="w-2.5 h-2.5" />{bug._count?.comments}
                                </span>
                              )}
                              {(bug.reportedByClientsCount || 0) > 0 && (
                                <span className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />{bug.reportedByClientsCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl flex flex-col items-center justify-center h-48 text-slate-500">
              <BugIcon className="w-8 h-8 mb-2" />
              <p>{t('no_bugs')}</p>
            </div>
          ) : (
            filtered.map(bug => {
                const storedComments = typeof window !== 'undefined' ? localStorage.getItem(`viewed_bug_comments_${bug.id}`) : null;
                const totalComments = bug._count?.comments || 0;
                const newComments = storedComments !== null ? (totalComments - Number(storedComments)) : totalComments;
                const finalNewComments = Math.max(0, newComments);

                return (
                  <div key={bug.id} className="group relative bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/70 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
                    <div className="flex items-start gap-4">
                      {/* Left: Bug info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/bugs/${bug.id}`} className="group/link block">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="text-[15px] font-semibold text-slate-100 group-hover/link:text-indigo-400 transition-colors">{bug.title}</h3>
                            {isBugUpdated(bug) && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {t('updated_at')}
                              </span>
                            )}
                            {finalNewComments > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full animate-pulse">
                                <MessageSquare className="w-3 h-3 text-rose-400 fill-rose-400/20" />
                                +{finalNewComments}
                              </span>
                            ) : (
                              totalComments > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-slate-700">
                                  <MessageSquare className="w-3 h-3 text-slate-600" />
                                  {totalComments}
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {bug.module && <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{bug.module}</span>}
                            {bug.clientPhone && <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">+{bug.clientPhone}</span>}
                          </div>
                          <p className="text-xs text-slate-400/80 line-clamp-2 leading-relaxed">{bug.description}</p>
                        </Link>
                      </div>

                      {/* Right: Meta info */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Clients count */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold tabular-nums transition-colors ${justUpvoted === bug.id ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {bug.reportedByClientsCount}
                          </span>
                          <button
                            onClick={() => setUpvoteTarget(bug.id)}
                            disabled={upvoteMutation.isPending && upvoteMutation.variables?.id === bug.id}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border font-bold transition-all duration-200 ${
                              justUpvoted === bug.id
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-95'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-indigo-500/20 hover:border-indigo-500 hover:text-indigo-400 hover:scale-105'
                            }`}
                          >
                            {justUpvoted === bug.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : upvoteMutation.isPending && upvoteMutation.variables?.id === bug.id ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-[10px] font-extrabold">+1</span>
                            )}
                          </button>
                        </div>

                        {/* Product */}
                        <div className="w-16 flex justify-center">
                          {bug.product && <ProductBadge name={bug.product.name} />}
                        </div>

                        {/* Priority */}
                        <div className="w-20 flex justify-center">
                          <PriorityBadge priority={bug.priority} />
                        </div>

                        {/* Status */}
                        <div className="w-20 flex justify-center">
                          <StatusBadge status={bug.status} />
                        </div>

                        {/* Assigned to */}
                        <div className="w-28">
                          {bug.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-medium shadow-sm">
                                {bug.assignedTo.fullName.charAt(0)}
                              </div>
                              <span className="text-xs text-slate-400 truncate">{bug.assignedTo.fullName}</span>
                            </div>
                          ) : <span className="text-xs text-slate-600 italic">{t('unassigned')}</span>}
                        </div>

                        {/* Created info */}
                        <div className="w-28 text-right">
                          <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3" />{formatDate(bug.createdAt)}
                          </div>
                          {bug.createdBy && (
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <span className="text-[10px] text-slate-600">{bug.createdBy.fullName}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="w-14 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>}
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
                <p className="text-xs text-slate-400 mt-0.5">Qaysi mijoz bu xatolikni yubordi?</p>
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
    clientPhone: bug.clientPhone || '',
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
              <label className="block text-xs text-slate-400 mb-1">Mijoz telefoni</label>
              <input value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)}
                placeholder="+998 90 000 00 00"
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
