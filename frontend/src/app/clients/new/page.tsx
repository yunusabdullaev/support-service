'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, AlertCircle, Calculator } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
}

function calculateTariff(employeeCount: number): number {
  if (employeeCount <= 3) return 500000;
  return 500000 + (employeeCount - 3) * 100000;
}

function formatSum(amount: number): string {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
}

export default function NewClientPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    direction: '',
    position: '',
    location: '',
    branchCount: 1,
    employeeCount: 0,
    referredFrom: '',
    note: '',
    productId: '',
    installationStatus: 'NEW',
    bitrixStatus: 'NOT_ADDED',
  });
  const [error, setError] = useState('');
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const tariff = calculateTariff(form.employeeCount);

  const mutation = useMutation({
    mutationFn: () => api.post('/clients', {
      ...form,
      direction: form.direction || undefined,
      position: form.position || undefined,
      location: form.location || undefined,
      referredFrom: form.referredFrom || undefined,
      note: form.note || undefined,
      productId: form.productId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      router.push('/clients');
    },
    onError: (err: any) => setError(err.response?.data?.message || t('no_data')),
  });

  return (
    <AppLayout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/clients" className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('new_client')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('new_client_subtitle')}</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="glass-card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('client_name')} <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
              placeholder={t('client_name_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('client_phone')} <span className="text-red-400">*</span>
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+998 90 000 00 00"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('client_product')}
            </label>
            <select
              value={form.productId}
              onChange={e => set('productId', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">{t('select_product')}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Direction & Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_direction')}</label>
              <input
                value={form.direction}
                onChange={e => set('direction', e.target.value)}
                placeholder={t('client_direction_placeholder')}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_position')}</label>
              <input
                value={form.position}
                onChange={e => set('position', e.target.value)}
                placeholder={t('client_position_placeholder')}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_location')}</label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder={t('client_location_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Branches & Employees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_branches')}</label>
              <input
                type="number"
                min={1}
                value={form.branchCount}
                onChange={e => set('branchCount', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_employees')}</label>
              <input
                type="number"
                min={0}
                value={form.employeeCount}
                onChange={e => set('employeeCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Tariff Calculation */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400/70 font-medium flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                {t('client_tariff')}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">{t('client_tariff_info')}</span>
            </div>
            <span className="text-lg font-bold text-emerald-400">{formatSum(tariff)}</span>
          </div>

          {/* Installation Status & Bitrix Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_installation_status')}</label>
              <select
                value={form.installationStatus}
                onChange={e => set('installationStatus', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="NEW">{t('installation_new')}</option>
                <option value="IN_PROGRESS">{t('installation_in_progress')}</option>
                <option value="INSTALLED">{t('installation_installed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_bitrix_status')}</label>
              <select
                value={form.bitrixStatus}
                onChange={e => set('bitrixStatus', e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="NOT_ADDED">{t('bitrix_not_added')}</option>
                <option value="ADDED">{t('bitrix_added')}</option>
              </select>
            </div>
          </div>

          {/* Referred From */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client_referred_from')}</label>
            <input
              value={form.referredFrom}
              onChange={e => set('referredFrom', e.target.value)}
              placeholder={t('client_referred_from_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('note')}</label>
            <textarea
              value={form.note}
              onChange={e => set('note', e.target.value)}
              rows={3}
              placeholder={t('client_note_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/clients"
              className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('saving')}</>
                : t('save_client')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
