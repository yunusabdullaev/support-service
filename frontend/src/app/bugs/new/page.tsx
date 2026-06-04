'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product, User } from '@/types';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 border-red-500 text-red-300',
  HIGH:     'bg-orange-500/20 border-orange-500 text-orange-300',
  MEDIUM:   'bg-yellow-500/20 border-yellow-500 text-yellow-300',
  LOW:      'bg-blue-500/20 border-blue-500 text-blue-300',
};

const PRIORITY_INACTIVE = 'bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-600';

export default function NewBugPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    productId: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
  });
  const [error, setError] = useState('');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const assignees = users.filter(u =>
    u.role === 'DEVELOPER' || u.role === 'ADMIN' || u.role === 'TEAM_LEADER'
  );

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/bugs', {
      ...data,
      assignedToId: data.assignedToId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bugs'] });
      router.push('/bugs');
    },
    onError: (err: any) => setError(err.response?.data?.message || t('no_data')),
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const PRIORITY_LABELS: Record<string, string> = {
    CRITICAL: t('priority_critical'),
    HIGH:     t('priority_high'),
    MEDIUM:   t('priority_medium'),
    LOW:      t('priority_low'),
  };

  return (
    <AppLayout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/bugs" className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('new_bug_title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('new_bug_subtitle')}</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="glass-card p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('bug_title')} <span className="text-red-400">*</span>
            </label>
            <input
              id="bug-title"
              type="text"
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('bug_title_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('product')} <span className="text-red-400">*</span>
            </label>
            <select
              id="bug-product"
              required
              value={form.productId}
              onChange={e => set('productId', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">{t('select_product')}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('priority')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    form.priority === p ? PRIORITY_STYLES[p] : PRIORITY_INACTIVE
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('assigned_to')}
            </label>
            <select
              id="bug-assignee"
              value={form.assignedToId}
              onChange={e => set('assignedToId', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">{t('unassigned')}</option>
              {assignees.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('description')} <span className="text-red-400">*</span>
            </label>
            <textarea
              id="bug-description"
              required
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={5}
              placeholder={t('bug_description_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/bugs"
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
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('creating')}</>
              ) : t('create_bug')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
