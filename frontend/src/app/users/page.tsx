'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import {
  UserPlus, Edit2, Trash2, Mail, X, AlertTriangle,
  ShieldCheck, Shield, UserCheck, UserX, Check, Phone
} from 'lucide-react';
import { PhoneInput } from '@/components/ui/PhoneInput';

// ─── Types ───────────────────────────────────────────
type Role = 'ADMIN' | 'TEAM_LEADER' | 'OPERATOR' | 'DEVELOPER' | 'SELLER';

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}

// ─── Role badge colors ────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  TEAM_LEADER: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  OPERATOR: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DEVELOPER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SELLER: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

// ─── Modal ────────────────────────────────────────────
function UserModal({
  isOpen, onClose, editUser, onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  editUser: User | null;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const [form, setForm] = useState<UserFormData>({
    fullName: editUser?.fullName || '',
    email: editUser?.email || '',
    password: '',
    role: (editUser?.role as Role) || 'OPERATOR',
  });
  const [error, setError] = useState('');

  // Reset form when editUser changes
  React.useEffect(() => {
    setForm({
      fullName: editUser?.fullName || '',
      email: editUser?.email || '',
      password: '',
      role: (editUser?.role as Role) || 'OPERATOR',
    });
    setError('');
  }, [editUser, isOpen]);

  const qc = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onSaved(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserFormData>) => api.patch(`/users/${editUser!.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onSaved(); },
    onError: (e: any) => setError(e.response?.data?.message || 'Error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (editUser) {
      const payload: any = { fullName: form.fullName, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const roles: Role[] = ['OPERATOR', 'DEVELOPER', 'SELLER', 'TEAM_LEADER', 'ADMIN'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-card p-6 animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {editUser ? t('edit_user_title') : t('new_user')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('full_name')}</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Aziz Karimov"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="aziz@hippo.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {editUser ? t('new_password') : t('password')}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={!editUser}
              minLength={6}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={editUser ? '••••••' : '••••••••'}
            />
            {editUser && <p className="text-xs text-slate-500 mt-1">{t('new_password_hint')}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{t('role')}</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.role === r
                      ? ROLE_COLORS[r]
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {editUser ? t('updating_user') : t('creating_user')}</>
              ) : (
                <>{editUser ? t('update_user') : t('create_user')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────
function DeleteConfirmModal({
  user, onClose, onConfirm, isPending,
}: {
  user: User | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { t } = useI18n();
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">{t('delete_confirm')}</h3>
          <p className="text-sm text-slate-400 mb-1">
            <span className="font-medium text-slate-200">{user.fullName}</span>
          </p>
          <p className="text-xs text-slate-500 mb-5">{t('delete_confirm_detail')}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              {t('cancel')}
            </button>
            <button onClick={onConfirm} disabled={isPending}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t('delete_user')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phone Assign Modal ───────────────────────────────
function PhoneAssignModal({
  user, onClose, onSave, isPending,
}: {
  user: User;
  onClose: () => void;
  onSave: (phone: string, telegramChatId?: string) => void;
  isPending: boolean;
}) {
  const [phone, setPhone] = useState(user.phone || '');
  const [tgId, setTgId] = useState(user.telegramChatId || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass-card p-6 animate-fade-in shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Nomer biriktirish</h3>
              <p className="text-xs text-slate-400">{user.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Telefon raqam
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Telegram Chat ID <span className="font-normal text-slate-500 lowercase">(ixtiyoriy)</span>
            </label>
            <input
              type="text"
              value={tgId}
              onChange={e => setTgId(e.target.value)}
              placeholder="123456789"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            />
            <p className="text-xs text-slate-500 mt-1">Telegram botdan /start bosib chat ID ni toping</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              Bekor
            </button>
            <button
              onClick={() => onSave(phone, tgId || undefined)}
              disabled={isPending}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isPending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check className="w-4 h-4" />}
              Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
export default function UsersPage() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [toggledId, setToggledId] = useState<string | null>(null);
  const [phoneUser, setPhoneUser] = useState<User | null>(null);

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_LEADER';

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeletingUser(null); },
  });

  const assignPhoneMutation = useMutation({
    mutationFn: ({ id, phone, telegramChatId }: { id: string; phone: string; telegramChatId?: string }) =>
      api.patch(`/users/${id}/phone`, { phone, telegramChatId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setPhoneUser(null); },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setToggledId(null); },
  });

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: t('role_admin'),
    TEAM_LEADER: t('role_team_leader'),
    OPERATOR: t('role_operator'),
    DEVELOPER: t('role_developer'),
    SELLER: t('role_seller'),
  };

  const groupCounts = {
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    TEAM_LEADER: users.filter(u => u.role === 'TEAM_LEADER').length,
    OPERATOR: users.filter(u => u.role === 'OPERATOR').length,
    DEVELOPER: users.filter(u => u.role === 'DEVELOPER').length,
    SELLER: users.filter(u => u.role === 'SELLER').length,
  };

  const openCreate = () => { setEditingUser(null); setModalOpen(true); };
  const openEdit = (u: User) => { setEditingUser(u); setModalOpen(true); };

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('team')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{users.length} {t('members')}</p>
          </div>
          {canManage && (
            <button
              id="add-user-btn"
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/30"
            >
              <UserPlus className="w-4 h-4" /> {t('add_user')}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(groupCounts).map(([role, count]) => (
            <div key={role} className="glass-card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                role === 'ADMIN' ? 'bg-red-500/20' :
                role === 'TEAM_LEADER' ? 'bg-indigo-500/20' :
                role === 'OPERATOR' ? 'bg-emerald-500/20' :
                role === 'SELLER' ? 'bg-amber-500/20' : 'bg-blue-500/20'
              }`}>
                {role === 'ADMIN' ? <Shield className={`w-4 h-4 text-red-400`} /> :
                 role === 'TEAM_LEADER' ? <ShieldCheck className="w-4 h-4 text-indigo-400" /> :
                 role === 'OPERATOR' ? <UserCheck className="w-4 h-4 text-emerald-400" /> :
                 role === 'SELLER' ? <UserCheck className="w-4 h-4 text-amber-400" /> :
                 <UserCheck className="w-4 h-4 text-blue-400" />}
              </div>
              <div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {[t('user'), t('email'), 'Telefon', t('role'), t('state'), t('joined'), ...(canManage ? [t('actions')] : [])].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{u.fullName}</p>
                            {!u.isActive && (
                              <span className="text-xs text-red-400 flex items-center gap-0.5">
                                <UserX className="w-3 h-3" /> {t('inactive')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-mono">{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Yo'q</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          {u.isActive ? t('active') : t('inactive')}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(u.createdAt)}</td>

                      {/* Actions */}
                      {canManage && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            {/* Edit */}
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                              title={t('edit_user')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle active / inactive */}
                            <button
                              onClick={() => {
                                setToggledId(u.id);
                                toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive });
                              }}
                              disabled={toggleActiveMutation.isPending && toggledId === u.id}
                              className={`p-1.5 rounded-lg transition-all ${
                                u.isActive
                                  ? 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                                  : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={u.isActive ? t('deactivate') : t('activate')}
                            >
                              {toggleActiveMutation.isPending && toggledId === u.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.isActive ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Phone assign */}
                            <button
                              onClick={() => setPhoneUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                              title="Telefon raqam biriktirish"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete (not self) */}
                            {u.id !== currentUser?.id && (
                              <button
                                onClick={() => setDeletingUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                title={t('delete_user')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editUser={editingUser}
        onSaved={() => setModalOpen(false)}
      />
      <DeleteConfirmModal
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
        isPending={deleteMutation.isPending}
      />

      {/* Phone Assign Modal */}
      {phoneUser && (
        <PhoneAssignModal
          user={phoneUser}
          onClose={() => setPhoneUser(null)}
          onSave={(phone, telegramChatId) =>
            assignPhoneMutation.mutate({ id: phoneUser.id, phone, telegramChatId })
          }
          isPending={assignPhoneMutation.isPending}
        />
      )}
    </AppLayout>
  );
}
