'use client';

import React, { useRef, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, BugStatus } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { ProductBadge } from '@/components/ProductBadge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Send, ImagePlus, X, ZoomIn, Pencil, Trash2, Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

const BUG_STATUSES: BugStatus[] = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'WAITING', 'FIXED', 'CLOSED', 'REJECTED'];

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Yangi',
  CONFIRMED: 'Tasdiqlangan',
  IN_PROGRESS: 'Jarayonda',
  WAITING: 'Kutmoqda',
  FIXED: 'Tuzatildi',
  CLOSED: 'Yopildi',
  REJECTED: 'Rad etildi',
};

export default function BugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showStatusMenu) return;
    const handler = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatusMenu]);

  const { data: bug, isLoading } = useQuery<Bug>({
    queryKey: ['bug', id],
    queryFn: () => api.get(`/bugs/${id}`).then(r => r.data),
  });

  useEffect(() => {
    if (bug) {
      localStorage.setItem(`viewed_bug_${bug.id}`, new Date().toISOString());
      localStorage.setItem(`viewed_bug_comments_${bug.id}`, (bug.comments?.length || 0).toString());
    }
  }, [bug]);

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/bugs/${id}/comments`, { comment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bug', id] }); setComment(''); },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      api.patch(`/bugs/${id}/comments/${commentId}`, { comment: text }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bug', id] }); setEditingCommentId(null); },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/bugs/${id}/comments/${commentId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bug', id] }); },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => api.delete(`/bugs/${id}/attachments/${attachmentId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bug', id] }); },
  });

  const statusMutation = useMutation({
    mutationFn: (status: BugStatus) => api.patch(`/bugs/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bug', id] });
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setShowStatusMenu(false);
    },
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      await Promise.all(files.map(file => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post(`/bugs/${id}/attachments`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }));
      qc.invalidateQueries({ queryKey: ['bug', id] });
    } finally {
      setIsUploading(false);
      if (uploadRef.current) uploadRef.current.value = '';
    }
  };

  const canChangeStatus = user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER' || user?.role === 'DEVELOPER';
  const canEditComment = (authorId: string) => user?.id === authorId || user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER';
  const canDeleteAttachment = (uploaderId?: string) => !uploaderId || user?.id === uploaderId || user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER';

  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!bug) return <AppLayout><div className="text-slate-400">Bug not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-5">

        {/* Back + Title */}
        <div className="flex items-start gap-3">
          <Link href="/bugs" className="mt-1 p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <PriorityBadge priority={bug.priority} />
              <StatusBadge status={bug.status} />
              {bug.product && <ProductBadge name={bug.product.name} />}
              {bug.module && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{bug.module}</span>}
              {bug.clientPhone && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  📞 +{bug.clientPhone}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{bug.title}</h1>
            <p className="text-slate-500 text-xs mt-1">
              {t('created_by')} {bug.createdBy?.fullName} · {formatDateTime(bug.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-4">

            {/* Description */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('description')}</h3>
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{bug.description}</p>
            </div>

            {/* Steps / Expected / Actual */}
            {(bug.stepsToReproduce || bug.expectedResult || bug.actualResult) && (
              <div className="space-y-3">
                {bug.stepsToReproduce && (
                  <div className="glass-card p-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('steps_to_reproduce')}</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {bug.expectedResult && (
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-semibold text-emerald-400 mb-2">✓ {t('expected_result')}</h4>
                      <p className="text-sm text-slate-300">{bug.expectedResult}</p>
                    </div>
                  )}
                  {bug.actualResult && (
                    <div className="glass-card p-4">
                      <h4 className="text-xs font-semibold text-red-400 mb-2">✗ {t('actual_result')}</h4>
                      <p className="text-sm text-slate-300">{bug.actualResult}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {t('comments')} ({bug.comments?.length || 0})
              </h3>

              <div className="space-y-3 mb-4">
                {bug.comments?.length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-4">{t('no_bugs').replace('Xatolar', 'Izohlar')}</p>
                )}
                {bug.comments?.map(c => (
                  <div key={c.id} className="flex gap-3 group/comment">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {c.user.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{c.user.fullName}</span>
                          <span className="text-[11px] text-slate-500">{formatDateTime(c.createdAt)}</span>
                        </div>
                        {canEditComment(c.user.id) && editingCommentId !== c.id && (
                          <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.comment); }}
                              className="p-1 rounded text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                              title={t('edit_comment')}
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteCommentMutation.mutate(c.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              title={t('delete_comment')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingCommentText}
                            onChange={e => setEditingCommentText(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800/60 border border-indigo-500/50 rounded-lg text-sm text-slate-200 focus:outline-none resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCommentMutation.mutate({ commentId: c.id, text: editingCommentText })}
                              disabled={editCommentMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> {t('save')}
                            </button>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2">{c.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={t('add_comment')}
                  className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && comment && commentMutation.mutate()}
                />
                <button
                  onClick={() => commentMutation.mutate()}
                  disabled={!comment || commentMutation.isPending}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                  title={t('send')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">

            {/* Details */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{t('details')}</h3>
              <div className="space-y-3">

                {/* Status — inline buttons */}
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">{t('status')}</p>
                  {canChangeStatus ? (
                    <div className="relative" ref={statusMenuRef}>
                      <button
                        onClick={() => setShowStatusMenu(v => !v)}
                        className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
                      >
                        <StatusBadge status={bug.status} />
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-1 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden w-44">
                          {BUG_STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => statusMutation.mutate(s)}
                              disabled={s === bug.status || statusMutation.isPending}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                                s === bug.status
                                  ? 'text-indigo-400 bg-indigo-500/10'
                                  : 'text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {s === bug.status && <Check className="w-3 h-3" />}
                              {s !== bug.status && <span className="w-3" />}
                              {STATUS_LABELS[s] || s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <StatusBadge status={bug.status} />
                  )}
                </div>

                {/* Assigned */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('assigned_to')}</p>
                  <p className="text-sm text-slate-300">{bug.assignedTo?.fullName || t('unassigned')}</p>
                </div>

                {/* Created by */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('created_by')}</p>
                  <p className="text-sm text-slate-300">{bug.createdBy?.fullName}</p>
                </div>

                {/* Deadline */}
                {bug.deadline && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('deadline')}</p>
                    <p className="text-sm text-slate-300">{formatDate(bug.deadline)}</p>
                  </div>
                )}

                {/* Updated */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('updated_at')}</p>
                  <p className="text-sm text-slate-300">{formatDate(bug.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {t('images')} {bug.attachments && bug.attachments.length > 0 && `(${bug.attachments.length})`}
                </h3>
                <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImages} />
                <button
                  onClick={() => uploadRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading
                    ? <><div className="w-3 h-3 border border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />Yuklanmoqda...</>
                    : <><ImagePlus className="w-3 h-3" />{t('add_image')}</>}
                </button>
              </div>

              {(!bug.attachments || bug.attachments.length === 0) ? (
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-600 hover:border-indigo-500/50 hover:text-slate-500 transition-all flex flex-col items-center gap-2 text-xs"
                >
                  <ImagePlus className="w-6 h-6" />
                  {t('click_to_add_image')}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {bug.attachments.map(a => (
                    <div key={a.id} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-colors">
                      <img
                        src={`${API_URL}${a.fileUrl}`}
                        alt={a.fileName}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setLightboxSrc(`${API_URL}${a.fileUrl}`)}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {canDeleteAttachment(a.userId) && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteAttachmentMutation.mutate(a.id); }}
                          disabled={deleteAttachmentMutation.isPending}
                          className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxSrc(null)}>
          <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src={lightboxSrc} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </AppLayout>
  );
}
