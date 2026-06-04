'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Bot, CheckCircle2, AlertCircle, Settings2 } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [form, setForm] = useState({ botToken: '', chatId: '', isActive: false });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: () => api.get('/settings/telegram').then(r => r.data),
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

  return (
    <AppLayout allowedRoles={['ADMIN']}>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings_title')}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{t('settings_subtitle')}</p>
        </div>

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
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('chat_id')}</label>
                <input type="text" value={displayChatId} onChange={e => setForm(f => ({...f, chatId: e.target.value}))}
                  placeholder="-100123456789"
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                <p className="text-xs text-slate-500 mt-1">{t('chat_id_hint')}</p>
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
                  onClick={() => updateMutation.mutate({ botToken: displayToken, chatId: displayChatId, isActive: displayActive })}
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
    </AppLayout>
  );
}
