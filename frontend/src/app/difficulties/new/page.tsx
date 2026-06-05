'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product } from '@/types';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, AlertCircle, Frown, Package, Phone } from 'lucide-react';
import Link from 'next/link';

export default function NewDifficultyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    productId: '',
    clientPhone: '',
    description: '',
  });
  const [error, setError] = useState('');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/difficulties', {
        title: data.title,
        description: data.description,
        ...(data.productId ? { productId: data.productId } : {}),
        ...(data.clientPhone ? { clientPhone: data.clientPhone } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difficulties'] });
      router.push('/difficulties');
    },
    onError: (err: any) => setError(err.response?.data?.message || t('no_data')),
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <AppLayout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/difficulties"
            className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Frown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t('new_difficulty_title')}</h1>
              <p className="text-slate-400 text-xs mt-0.5">{t('new_difficulty_subtitle')}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate(form); }}
          className="glass-card p-6 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('difficulty_title_label')} <span className="text-red-400">*</span>
            </label>
            <input
              id="difficulty-title"
              type="text"
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('difficulty_title_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              {t('product')}
              <span className="text-[10px] text-slate-600 font-normal ml-0.5">(ixtiyoriy)</span>
            </label>
            <select
              id="difficulty-product"
              value={form.productId}
              onChange={e => set('productId', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">{t('select_product')}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Client Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              {t('client_phone') || 'Mijoz telefoni'}
              <span className="text-[10px] text-slate-600 font-normal ml-0.5">(ixtiyoriy)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-mono">+</span>
              <input
                id="difficulty-client-phone"
                type="tel"
                value={form.clientPhone}
                onChange={e => set('clientPhone', e.target.value.replace(/\D/g, ''))}
                placeholder="998901234567"
                className="w-full pl-6 pr-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('description')} <span className="text-red-400">*</span>
            </label>
            <textarea
              id="difficulty-description"
              required
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={6}
              placeholder={t('difficulty_description_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Frown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Muammoyingizni aniq va batafsil yozing. Tizim, modul, yoki jarayon nomi ko'rsatilsa — tezroq hal qilinadi.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/difficulties"
              className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submit_difficulty')
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
