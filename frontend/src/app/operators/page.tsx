'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import {
  Users, Phone, Send, Building2, UserCircle, Save,
  ChevronDown, ChevronUp, Search, Edit3, X, Check,
} from 'lucide-react';

interface OperatorContact extends User {
  personalPhone?: string;
  corporatePhone?: string;
  personalTelegram?: string;
  corporateTelegram?: string;
}

export default function OperatorsPage() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_LEADER';

  const { data: users = [], isLoading } = useQuery<OperatorContact[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditingId(null);
    },
  });

  const operators = users.filter(
    u => u.isActive && (u.role === 'OPERATOR' || u.role === 'TEAM_LEADER')
  );

  const filtered = operators.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (user: OperatorContact) => {
    setEditingId(user.id);
    setEditData({
      personalPhone: user.personalPhone || '',
      corporatePhone: user.corporatePhone || '',
      personalTelegram: user.personalTelegram || '',
      corporateTelegram: user.corporateTelegram || '',
    });
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({ id, data: editData });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'TEAM_LEADER': return 'Team Leader';
      case 'OPERATOR': return 'Operator';
      default: return role;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'TEAM_LEADER':
        return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
      case 'OPERATOR':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER', 'OPERATOR', 'DEVELOPER']}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Operatorlar haqida</h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Kontakt ma'lumotlari — {filtered.length} ta operator
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 w-64"
            />
          </div>
        </div>

        {/* Operators list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Operator topilmadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => {
              const isEditing = editingId === user.id;
              const isExpanded = expandedId === user.id;

              return (
                <div
                  key={user.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden transition-all hover:border-slate-700"
                >
                  {/* Header Row */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center border border-slate-700">
                        <UserCircle className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{user.fullName}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getRoleBadge(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick info badges */}
                      {(user.personalPhone || user.corporatePhone) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-md">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Tel</span>
                        </div>
                      )}
                      {(user.personalTelegram || user.corporateTelegram) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-md">
                          <Send className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] text-blue-400">TG</span>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 px-5 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Shaxsiy */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
                            <UserCircle className="w-3.5 h-3.5" />
                            Shaxsiy
                          </div>

                          {/* Shaxsiy Telefon */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Telefon
                            </label>
                            {isEditing ? (
                              <input
                                value={editData.personalPhone}
                                onChange={e => setEditData({ ...editData, personalPhone: e.target.value })}
                                placeholder="+998 XX XXX XX XX"
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            ) : (
                              <p className={`text-sm ${user.personalPhone ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                                {user.personalPhone || 'Kiritilmagan'}
                              </p>
                            )}
                          </div>

                          {/* Shaxsiy Telegram */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Send className="w-3 h-3" /> Telegram
                            </label>
                            {isEditing ? (
                              <input
                                value={editData.personalTelegram}
                                onChange={e => setEditData({ ...editData, personalTelegram: e.target.value })}
                                placeholder="@username"
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            ) : (
                              <p className={`text-sm ${user.personalTelegram ? 'text-blue-400' : 'text-slate-600 italic'}`}>
                                {user.personalTelegram || 'Kiritilmagan'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Korporativ */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
                            <Building2 className="w-3.5 h-3.5" />
                            Korporativ
                          </div>

                          {/* Korporativ Telefon */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Telefon
                            </label>
                            {isEditing ? (
                              <input
                                value={editData.corporatePhone}
                                onChange={e => setEditData({ ...editData, corporatePhone: e.target.value })}
                                placeholder="+998 XX XXX XX XX"
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            ) : (
                              <p className={`text-sm ${user.corporatePhone ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                                {user.corporatePhone || 'Kiritilmagan'}
                              </p>
                            )}
                          </div>

                          {/* Korporativ Telegram */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Send className="w-3 h-3" /> Telegram
                            </label>
                            {isEditing ? (
                              <input
                                value={editData.corporateTelegram}
                                onChange={e => setEditData({ ...editData, corporateTelegram: e.target.value })}
                                placeholder="@username"
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            ) : (
                              <p className={`text-sm ${user.corporateTelegram ? 'text-blue-400' : 'text-slate-600 italic'}`}>
                                {user.corporateTelegram || 'Kiritilmagan'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {canEdit && (
                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <X className="w-3 h-3" /> Bekor
                              </button>
                              <button
                                onClick={() => saveEdit(user.id)}
                                disabled={updateMutation.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {updateMutation.isPending ? (
                                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                Saqlash
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); startEdit(user); }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3 h-3" /> Tahrirlash
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
