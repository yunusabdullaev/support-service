'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Phone, Zap, ArrowRight, X } from 'lucide-react';

export function PhoneModal() {
  const { needsPhone, savePhone, skipPhone } = useAuth();
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
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0,3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5)}`;
    if (digits.length <= 10) return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,8)} ${digits.slice(8)}`;
    return `${digits.slice(0,3)} ${digits.slice(3,5)} ${digits.slice(5,8)} ${digits.slice(8,10)} ${digits.slice(10)}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm relative">
        {/* Close / Skip button */}
        <button
          onClick={skipPhone}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm"
        >
          Keyinroq <X className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 mb-3 shadow-lg shadow-indigo-900/50">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white">Telefon raqamingiz</h1>
          <p className="text-slate-400 text-xs mt-1">
            Telegram xabarnomalar uchun raqamingizni kiriting
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
                  autoFocus
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="998 90 123 45 67"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm tracking-wider"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">Format: 998 XX XXX XX XX</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={skipPhone}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-medium rounded-xl transition-colors"
              >
                Keyinroq
              </button>
              <button
                type="submit"
                disabled={isLoading || phone.replace(/\D/g, '').length < 9}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Saqlash <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
