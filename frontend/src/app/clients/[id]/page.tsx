'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  Phone,
  Briefcase,
  MapPin,
  Building2,
  UserCheck,
  Send,
  Trash2,
  MessageSquare,
  Megaphone,
  Package,
  Clock,
  User2,
  Calculator,
  Settings2
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
  referredFrom?: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  productId?: string;
  installationStatus: string;
  bitrixStatus: string;
  createdBy?: {
    id: string;
    fullName: string;
    role: string;
  };
  product?: {
    id: string;
    name: string;
  };
  comments: ClientComment[];
}

function calculateTariff(employeeCount: number): number {
  if (employeeCount <= 3) return 500000;
  return 500000 + (employeeCount - 3) * 100000;
}

function formatSum(amount: number): string {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
}

const INSTALLATION_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  INSTALLED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const BITRIX_STATUS_COLORS: Record<string, string> = {
  NOT_ADDED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  ADDED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

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

  const updateStatusMutation = useMutation({
    mutationFn: (data: Record<string, string>) => api.patch(`/clients/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
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

  const getInstallationLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: t('installation_new'),
      IN_PROGRESS: t('installation_in_progress'),
      INSTALLED: t('installation_installed'),
    };
    return map[status] || status;
  };

  const getBitrixLabel = (status: string) => {
    const map: Record<string, string> = {
      NOT_ADDED: t('bitrix_not_added'),
      ADDED: t('bitrix_added'),
    };
    return map[status] || status;
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

  const tariff = calculateTariff(client.employeeCount);

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

              {/* Status badges */}
              <div className="flex flex-wrap justify-center gap-2">
                {client.product && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                    <Package className="w-3 h-3" />
                    {client.product.name}
                  </span>
                )}
              </div>

              {/* Inline status selectors */}
              <div className="space-y-3">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    {t('client_installation_status')}
                  </span>
                  <select
                    value={client.installationStatus}
                    onChange={e => updateStatusMutation.mutate({ installationStatus: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${INSTALLATION_STATUS_COLORS[client.installationStatus] || 'bg-slate-800/60 border-slate-700 text-slate-300'}`}
                  >
                    <option value="NEW">{t('installation_new')}</option>
                    <option value="IN_PROGRESS">{t('installation_in_progress')}</option>
                    <option value="INSTALLED">{t('installation_installed')}</option>
                  </select>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1">
                    <Settings2 className="w-3 h-3" />
                    {t('client_bitrix_status')}
                  </span>
                  <select
                    value={client.bitrixStatus}
                    onChange={e => updateStatusMutation.mutate({ bitrixStatus: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-medium border focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${BITRIX_STATUS_COLORS[client.bitrixStatus] || 'bg-slate-800/60 border-slate-700 text-slate-300'}`}
                  >
                    <option value="NOT_ADDED">{t('bitrix_not_added')}</option>
                    <option value="ADDED">{t('bitrix_added')}</option>
                  </select>
                </div>
              </div>

              {/* Tariff */}
              <div className="flex items-center justify-between px-3 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <span className="text-xs text-emerald-400/70 font-medium flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  {t('client_tariff')}
                </span>
                <span className="text-base font-bold text-emerald-400">{formatSum(tariff)}</span>
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

                {client.referredFrom && (
                  <div className="flex items-start gap-3">
                    <Megaphone className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t('client_referred_from')}</span>
                      <span className="text-slate-200 text-sm">{client.referredFrom}</span>
                    </div>
                  </div>
                )}
              </div>

              {client.note && (
                <div className="border-t border-slate-800/80 pt-4">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{t('comment')}</span>
                  <p className="text-slate-400 text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 leading-relaxed whitespace-pre-wrap">
                    {client.note}
                  </p>
                </div>
              )}

              {/* Footer: Created by + Date (bigger) */}
              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                {client.createdBy && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User2 className="w-3.5 h-3.5" />
                    <span>{t('client_created_by')}: <span className="text-slate-300 font-medium">{client.createdBy.fullName}</span></span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-300">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>{formatDateTime(client.createdAt)}</span>
                </div>
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
                            <span className="text-[10px] text-slate-600">{formatDateTime(c.createdAt)}</span>
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
