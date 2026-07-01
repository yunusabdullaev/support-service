'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useProduct } from '@/lib/product';
import {
  Bot, CheckCircle2, AlertCircle, Settings2,
  Shield, Moon, Sun, KeyRound, Eye, EyeOff, Plus, X as XIcon, Package, Check,
  UserCircle, Edit3
} from 'lucide-react';

function ChangeNameForm() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (name: string) => api.patch('/auth/profile', { fullName: name }),
    onSuccess: (res) => {
      setSuccess(t('name_updated'));
      setError('');
      if (refreshUser) refreshUser();
      // update localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        u.fullName = fullName.trim();
        localStorage.setItem('user', JSON.stringify(u));
      }
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('error_occurred'));
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    mutation.mutate(fullName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{t('change_name')}</h2>
          <p className="text-xs text-slate-500">{t('change_name_desc')}</p>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{success}</div>}

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('full_name_label')}</label>
        <input
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Ism Familiya"
          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending || fullName.trim() === user?.fullName}
        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Edit3 className="w-4 h-4" />
        {mutation.isPending ? t('saving_dots') : t('save')}
      </button>
    </form>
  );
}

function ChangePasswordForm() {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.patch('/auth/change-password', { oldPassword, newPassword }),
    onSuccess: () => {
      setSuccess(t('password_change_success'));
      setError('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || t('password_change_error'));
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwords_dont_match'));
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{t('change_password')}</h2>
          <p className="text-xs text-slate-500">{t('settings_subtitle')}</p>
        </div>
      </div>

      {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>}
      {success && <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{success}</div>}

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('current_password')}</label>
        <div className="relative">
          <input
            required
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button type="button" onClick={() => setShowOld(v => !v)} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
            {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('new_password')}</label>
          <div className="relative">
            <input
              required
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button type="button" onClick={() => setShowNew(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('confirm_password')}</label>
          <div className="relative">
            <input
              required
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 pr-10 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {mutation.isPending ? t('saving') : t('save')}
      </button>
    </form>
  );
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedProductId, setSelectedProductId } = useProduct();
  const qc = useQueryClient();

  const [botToken, setBotToken] = useState('');
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [newChatId, setNewChatId] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isAdmin = user?.role === 'ADMIN';
  const canManageBot = user?.role === 'ADMIN' || user?.role === 'TEAM_LEADER';

  const { data: products = [] } = useQuery<{ id: string; name: string; description?: string; isActive: boolean }[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: () => api.get('/settings/telegram').then(r => r.data),
    enabled: canManageBot,
  });

  React.useEffect(() => {
    if (settings) {
      if (settings.botToken) setBotToken(settings.botToken);
      if (settings.phones) {
        setChatIds(settings.phones.split(',').map((p: string) => p.trim()).filter(Boolean));
      }
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/settings/telegram', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-settings'] }),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/settings/telegram/test'),
    onSuccess: (r) => setTestResult(r.data),
    onError: () => setTestResult({ success: false, message: '❌ Ulanish xatosi' }),
  });

  const addChatId = () => {
    const val = newChatId.trim();
    if (val && !chatIds.includes(val)) {
      setChatIds(p => [...p, val]);
    }
    setNewChatId('');
  };

  const removeChatId = (idx: number) => setChatIds(p => p.filter((_, i) => i !== idx));

  const handleSave = () => {
    updateMutation.mutate({ botToken: botToken.trim(), phones: chatIds.join(','), isActive: true });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings_title')}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{t('settings_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Side: General Profile & User Settings */}
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">{t('product_select')}</h2>
                  <p className="text-xs text-slate-500">{t('product_select_desc')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedProductId(null)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${
                    selectedProductId === null
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{t('all_products')}</span>
                    {selectedProductId === null && <Check className="w-4 h-4 text-orange-400" />}
                  </div>
                  <p className="text-xs text-slate-400">{t('all_products_desc')}</p>
                </button>

                {products.filter(p => p.isActive).map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`relative p-4 rounded-xl border text-left transition-all ${
                      selectedProductId === product.id
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{product.name}</span>
                      {selectedProductId === product.id && <Check className="w-4 h-4 text-orange-400" />}
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-400 line-clamp-1" title={product.description}>
                        {product.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* General Settings: Language & Theme */}
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">{t('general_settings')}</h2>
                  <p className="text-xs text-slate-500">{t('general_settings_subtitle')}</p>
                </div>
              </div>

              {/* Language Switcher */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('interface_language')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'uz', label: 'Oʻzbekcha', flag: '🇺🇿' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                    { code: 'en', label: 'English', flag: '🇬🇧' }
                  ].map(l => (
                    <button
                      key={l.code}
                      onClick={() => setLocale(l.code as any)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                        locale === l.code
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-900/35'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('display_mode')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-900/35'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>{t('theme_dark')}</span>
                  </button>
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      theme === 'light'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-900/35'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>{t('theme_light')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Change Name */}
            <ChangeNameForm />

            {/* Change Password Form */}
            <ChangePasswordForm />
          </div>

          {/* Right Side: Telegram & Monitoring Settings (ADMIN + TEAM_LEADER) */}
          {canManageBot && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">{t('telegram_notifications')}</h2>
                    <p className="text-xs text-slate-500">{t('telegram_subtitle')}</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-10 bg-slate-800 rounded-lg" />
                    <div className="h-10 bg-slate-800 rounded-lg" />
                  </div>
                ) : (
                  <div className="space-y-5">

                    {/* Bot Token */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('bot_token_label')}</label>
                      <input
                        type="password"
                        value={botToken}
                        onChange={e => setBotToken(e.target.value)}
                        placeholder="1234567890:AAHh..."
                        className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-1">{t('bot_token_hint')}</p>
                    </div>

                    <div className="border-t border-slate-800" />

                    {/* Chat IDs */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        {t('chat_id_label')}
                        <span className="ml-1.5 text-xs font-normal text-slate-500">({t('chat_id_hint_receivers')})</span>
                      </label>

                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newChatId}
                          onChange={e => setNewChatId(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChatId())}
                          placeholder="123456789"
                          className="flex-1 px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={addChatId}
                          disabled={!newChatId.trim()}
                          className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {chatIds.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-1.5">{t('no_chat_ids')}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {chatIds.map((id, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                              <span className="text-sm text-slate-200 font-mono">{id}</span>
                              <button type="button" onClick={() => removeChatId(i)} className="p-0.5 text-slate-500 hover:text-red-400 transition-colors">
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                        <p className="text-xs text-slate-400 font-medium mb-1">💡 {t('how_it_works')}</p>
                        <p className="text-xs text-slate-500">1. {t('how_step_1')}</p>
                        <p className="text-xs text-slate-500">2. {t('how_step_2')}</p>
                        <p className="text-xs text-slate-500">3. {t('how_step_3')}</p>
                      </div>
                    </div>

                    {/* Test result */}
                    {testResult && (
                      <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                        testResult.success
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        {testResult.success ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => testMutation.mutate()} disabled={testMutation.isPending || !botToken.trim()}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                        {testMutation.isPending ? t('checking_dots') : t('check_connection')}
                      </button>
                      <button type="button" onClick={handleSave} disabled={updateMutation.isPending}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                        {updateMutation.isPending ? t('saving_dots') : t('save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Settings2 className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300">{t('monitoring_config')}</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <p>• {t('monitoring_info_1')}</p>
                  <p>• {t('monitoring_info_2')}</p>
                  <p>• {t('monitoring_info_3')}</p>
                  <p>• {t('monitoring_info_4')} <span className="text-indigo-400">{t('nav_monitoring')}</span> {t('monitoring_info_5')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
