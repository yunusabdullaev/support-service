'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Zap, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || t('invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-900/50">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Hippo Support</h1>
          <p className="text-slate-400 mt-1">Control Center</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@hippo.com" required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>
            <button id="login-btn" type="submit" disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30">
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('signing_in')}</>
              ) : t('sign_in')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">{t('demo_credentials')}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@hippo.com', pass: 'admin123' },
                { label: 'Team Leader', email: 'aziz@hippo.com', pass: 'user123' },
              ].map(({ label, email: e, pass }) => (
                <button key={label} type="button" onClick={() => { setEmail(e); setPassword(pass); }}
                  className="text-xs px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
