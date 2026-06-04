'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Phone, Zap, ArrowRight } from 'lucide-react';

export function PhoneModal() {
  const { needsPhone, savePhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!needsPhone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Telefon raqam noto\'g\'ri');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await savePhone(phone);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    // Format: 998 90 123 45 67
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5)}`;
    if (digits.length <= 10) return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,8)} ${digits.slice(8)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,8)} ${digits.slice(8,10)} ${digits.slice(10)}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-900/50">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Telefon raqamingiz</h1>
          <p className="text-slate-400 text-sm mt-1">
            Tizimga to'liq kirish uchun raqamingizni kiriting
          </p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Telefon raqam
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="phone-input"
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="998 90 123 45 67"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm tracking-wider"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Format: 998 XX XXX XX XX
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.replace(/\D/g, '').length < 9}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Davom etish <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
