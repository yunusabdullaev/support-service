'use client';

import React, { useRef, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bug, BugStatus, User } from '@/types';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, MessageSquare, Paperclip, Send, Edit2, CheckCircle2, ImagePlus, X, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function BugDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [editStatus, setEditStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<BugStatus>('NEW');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const { data: bug, isLoading } = useQuery<Bug>({
    queryKey: ['bug', id],
    queryFn: () => api.get(`/bugs/${id}`).then(r => r.data),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/bugs/${id}/comments`, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bug', id] });
      setComment('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: BugStatus) => api.patch(`/bugs/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bug', id] });
      qc.invalidateQueries({ queryKey: ['bugs'] });
      setEditStatus(false);
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

  const bugStatuses: BugStatus[] = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'WAITING', 'FIXED', 'CLOSED', 'REJECTED'];

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  if (!bug) return <AppLayout><div className="text-slate-400">Bug not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/bugs" className="mt-1 p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <PriorityBadge priority={bug.priority} />
              <StatusBadge status={bug.status} />
              {bug.product && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{bug.product.name}</span>}
              {bug.module && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{bug.module}</span>}
            </div>
            <h1 className="text-xl font-bold text-white">{bug.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Created by {bug.createdBy?.fullName} · {formatDateTime(bug.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Description</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.description}</p>
            </div>

            {bug.stepsToReproduce && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Steps to Reproduce</h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {bug.expectedResult && (
                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold text-emerald-400 mb-2">✓ Expected Result</h4>
                  <p className="text-sm text-slate-300">{bug.expectedResult}</p>
                </div>
              )}
              {bug.actualResult && (
                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold text-red-400 mb-2">✗ Actual Result</h4>
                  <p className="text-sm text-slate-300">{bug.actualResult}</p>
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comments ({bug.comments?.length || 0})
              </h3>
              <div className="space-y-3 mb-4">
                {bug.comments?.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {c.user.fullName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-200">{c.user.fullName}</span>
                        <span className="text-xs text-slate-500">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg p-3">{c.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && commentMutation.mutate()}
                />
                <button
                  onClick={() => commentMutation.mutate()}
                  disabled={!comment || commentMutation.isPending}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  {editStatus ? (
                    <div className="space-y-2">
                      <select value={newStatus} onChange={e => setNewStatus(e.target.value as BugStatus)}
                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        {bugStatuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                      <div className="flex gap-1">
                        <button onClick={() => statusMutation.mutate(newStatus)}
                          className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditStatus(false)}
                          className="flex-1 py-1 bg-slate-700 text-slate-300 text-xs rounded transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER' || user?.role === 'DEVELOPER') ? (
                    <button onClick={() => { setEditStatus(true); setNewStatus(bug.status); }}
                      className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                      <StatusBadge status={bug.status} />
                      <Edit2 className="w-3 h-3 text-slate-600" />
                    </button>
                  ) : (
                    <StatusBadge status={bug.status} />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                  <p className="text-slate-300">{bug.assignedTo?.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Created By</p>
                  <p className="text-slate-300">{bug.createdBy?.fullName}</p>
                </div>
                {bug.deadline && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Deadline</p>
                    <p className="text-slate-300">{formatDate(bug.deadline)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Updated</p>
                  <p className="text-slate-300">{formatDate(bug.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Attachments / Images */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  Rasmlar {bug.attachments && bug.attachments.length > 0 && `(${bug.attachments.length})`}
                </h3>
                <>
                  <input ref={uploadRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUploadImages} />
                  <button
                    onClick={() => uploadRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isUploading
                      ? <><div className="w-3 h-3 border border-indigo-400/50 border-t-indigo-400 rounded-full animate-spin" />Yuklanmoqda...</>
                      : <><ImagePlus className="w-3 h-3" />Rasm qo'sh</>}
                  </button>
                </>
              </div>

              {(!bug.attachments || bug.attachments.length === 0) ? (
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-700 rounded-lg text-slate-600 hover:border-indigo-500/50 hover:text-slate-500 transition-all flex flex-col items-center gap-2 text-xs"
                >
                  <ImagePlus className="w-6 h-6" />
                  Rasm qo'shish uchun bosing
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {bug.attachments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setLightboxSrc(`${API_URL}${a.fileUrl}`)}
                      className="relative group aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-colors"
                    >
                      <img
                        src={`${API_URL}${a.fileUrl}`}
                        alt={a.fileName}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxSrc}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </AppLayout>
  );
}
