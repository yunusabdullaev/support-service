'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Phone,
  Briefcase,
  MapPin,
  Building2,
  UserCheck,
  Send,
  Trash2,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

interface ClientComment {
  id: string;
  clientId: string;
  text: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    role: string;
  };
}

interface ClientDetail {
  id: string;
  fullName: string;
  phone: string;
  direction?: string;
  position?: string;
  location?: string;
  branchCount: number;
  employeeCount: number;
  note?: string;
  isActive: boolean;
  createdAt: string;
  comments: ClientComment[];
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: client, isLoading } = useQuery<ClientDetail>({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`).then(r => r.data),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/comments`, { text: commentText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      setCommentText('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/clients/${id}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentMutation.isPending) return;
    commentMutation.mutate();
  };

  const canDeleteComment = (authorId: string) => {
    return user?.id === authorId || user?.role === 'ADMIN';
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="text-slate-400 p-6 glass-card text-center">
          {t('no_data')}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/clients"
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{client.fullName}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{client.position || t('nav_clients')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Details Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-950/35">
                  {client.fullName.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3.5">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_phone')}</span>
                    <span className="text-slate-200 text-sm font-mono">{client.phone}</span>
                  </div>
                </div>

                {client.direction && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_direction')}</span>
                      <span className="text-slate-200 text-sm">{client.direction}</span>
                    </div>
                  </div>
                )}

                {client.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_location')}</span>
                      <span className="text-slate-200 text-sm">{client.location}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_branches')}</span>
                    <span className="text-slate-200 text-sm">{client.branchCount}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserCheck className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_employees')}</span>
                    <span className="text-slate-200 text-sm">{client.employeeCount}</span>
                  </div>
                </div>
              </div>

              {client.note && (
                <div className="border-t border-slate-800/80 pt-4">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{t('comment')}</span>
                  <p className="text-slate-400 text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 leading-relaxed whitespace-pre-wrap">
                    {client.note}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-800/80 pt-4 text-center">
                <span className="text-[10px] text-slate-600">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="md:col-span-2 space-y-4">
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                {t('comments')}
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400">
                  {client.comments?.length || 0}
                </span>
              </h2>

              {/* Add Comment Form */}
              <form onSubmit={handleSubmitComment} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder={t('add_comment')}
                  className="flex-1 px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {!client.comments || client.comments.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">{t('no_data')}</p>
                ) : (
                  client.comments.map(c => (
                    <div key={c.id} className="p-4 rounded-xl bg-slate-900/35 border border-slate-800/60 flex gap-3 group">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-400 flex-shrink-0">
                        {c.createdBy?.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{c.createdBy?.fullName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase font-mono font-bold tracking-wider">
                              {c.createdBy?.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600">{formatDate(c.createdAt)}</span>
                            {canDeleteComment(c.createdById) && (
                              <button
                                onClick={() => deleteCommentMutation.mutate(c.id)}
                                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                                title={t('delete_comment')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap leading-relaxed">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
