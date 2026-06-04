'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import {
  Bot, CheckCircle2, AlertCircle, Settings2,
  Shield, Moon, Sun, KeyRound, Eye, EyeOff, Plus, X as XIcon
} from 'lucide-react';

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
  const qc = useQueryClient();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [form, setForm] = useState<{ botToken: string; chatId: string; isActive: boolean; recipients?: string[] }>({ botToken: '', chatId: '', isActive: false });
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');

  // Only run this query for ADMIN users to avoid 403/Forbidden errors on backend
  const isAdmin = user?.role === 'ADMIN';

  const { data: settings, isLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: () => api.get('/settings/telegram').then(r => r.data),
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch('/settings/telegram', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-settings'] }),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/settings/telegram/test'),
    onSuccess: (r) => setTestResult(r.data),
    onError: () => setTestResult({ success: false, message: 'Connection failed' }),
  });

  const displaySettings = settings || {};
  const displayToken = form.botToken || displaySettings.botToken || '';
  const displayChatId = form.chatId || displaySettings.chatId || '';
  const displayActive = form.isActive ?? displaySettings.isActive ?? false;

  // Sync recipients from server
  React.useEffect(() => {
    if (settings?.recipients) setRecipients(settings.recipients);
  }, [settings]);

  const addRecipient = () => {
    const val = newRecipient.trim();
    if (val && !recipients.includes(val)) {
      setRecipients(r => [...r, val]);
    }
    setNewRecipient('');
  };

  const removeRecipient = (idx: number) => {
    setRecipients(r => r.filter((_, i) => i !== idx));
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

            {/* Change Password Form */}
            <ChangePasswordForm />
          </div>

          {/* Right Side: Telegram & Monitoring Settings (ADMIN ONLY) */}
          {isAdmin && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('bot_token')}</label>
                      <input type="password" value={displayToken} onChange={e => setForm(f => ({...f, botToken: e.target.value}))}
                        placeholder="1234567890:AAAA..."
                        className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        {t('chat_id')}
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(ixtiyoriy)</span>
                      </label>
                      <input type="text" value={displayChatId} onChange={e => setForm(f => ({...f, chatId: e.target.value}))}
                        placeholder="-100123456789 (bo'sh qolsa ham bo'ladi)"
                        className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                      <p className="text-xs text-slate-500 mt-1">Chat ID bo'lmasa, token tekshiriladi. Xabar yuborish uchun kerak.</p>
                    </div>

                    {/* Recipients list */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Xabar oladiganlar
                        <span className="ml-1.5 text-xs font-normal text-slate-500">(Telegram Chat ID)</span>
                      </label>

                      {/* Add new */}
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newRecipient}
                          onChange={e => setNewRecipient(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                          placeholder="Chat ID yoki raqam (123456789)"
                          className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                        />
                        <button
                          type="button"
                          onClick={addRecipient}
                          disabled={!newRecipient.trim()}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* List */}
                      {recipients.length === 0 ? (
                        <p className="text-xs text-slate-600 italic py-2">Hali nomer qo'shilmagan</p>
                      ) : (
                        <div className="space-y-1.5">
                          {recipients.map((r, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                              <span className="text-sm text-slate-300 font-mono">{r}</span>
                              <button
                                type="button"
                                onClick={() => removeRecipient(i)}
                                className="p-0.5 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <XIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 mt-1.5">Bot'dan /start bosib o'z Chat ID'ingizni toping: @userinfobot</p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-300">{t('enable_notifications')}</p>
                        <p className="text-xs text-slate-500">{t('enable_notifications_hint')}</p>
                      </div>
                      <button type="button" onClick={() => setForm(f => ({...f, isActive: !displayActive}))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${displayActive ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${displayActive ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    {testResult && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {testResult.message}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                        {testMutation.isPending ? t('testing') : t('test_connection')}
                      </button>
                      <button type="button"
                        onClick={() => updateMutation.mutate({ botToken: displayToken, chatId: displayChatId, isActive: displayActive, recipients })}
                        disabled={updateMutation.isPending}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                        {updateMutation.isPending ? t('saving') : t('save')}
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
