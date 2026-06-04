'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product, User } from '@/types';
import { ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex gap-2">
        {[0, 1, 2].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
              value === v
                ? v === 2 ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                  : v === 1 ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-300'
                  : 'bg-red-500/20 border border-red-500 text-red-300'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
            }`}>{v}</button>
        ))}
      </div>
    </div>
  );
}

export default function NewDialogReviewPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useI18n();
  const [form, setForm] = useState({
    operatorId: '',
    productId: '',
    clientName: '',
    dialogText: '',
    reviewDate: new Date().toISOString().slice(0, 10),
    firstResponseScore: 1,
    understandingScore: 1,
    solutionScore: 1,
    communicationScore: 1,
    closingScore: 1,
    mistakes: '',
    comment: '',
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
  const operators = users.filter(u => u.role === 'OPERATOR' || u.role === 'TEAM_LEADER');

  const totalScore = form.firstResponseScore + form.understandingScore + form.solutionScore + form.communicationScore + form.closingScore;

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/dialog-reviews', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      router.push('/dialog-reviews');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to create review'),
  });

  const setScore = (key: string, v: number) => setForm(f => ({...f, [key]: v}));

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dialog-reviews" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('new_review_title')}</h1>
            <p className="text-slate-400 text-sm">{t('new_review_subtitle')}</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">{t('basic_info')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('operator')} *</label>
                <select required value={form.operatorId} onChange={e => setForm({...form, operatorId: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">{t('select_operator')}</option>
                  {operators.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('product')}</label>
                <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">{t('select_product')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('client')}</label>
                <input type="text" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})}
                  placeholder={t('dialog_client_placeholder')}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('review_date')}</label>
                <input type="date" value={form.reviewDate} onChange={e => setForm({...form, reviewDate: e.target.value})}
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('dialog_text')}</label>
              <textarea value={form.dialogText} onChange={e => setForm({...form, dialogText: e.target.value})}
                rows={6} placeholder={t('paste_dialog')}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
            </div>
          </div>

          {/* Scoring */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">{t('evaluation_scores')}</h3>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-xl font-bold text-white">{totalScore}</span>
                <span className="text-slate-500">/10</span>
              </div>
            </div>
            <ScoreSelector label={t('first_response')} value={form.firstResponseScore} onChange={v => setScore('firstResponseScore', v)} />
            <ScoreSelector label={t('understanding')} value={form.understandingScore} onChange={v => setScore('understandingScore', v)} />
            <ScoreSelector label={t('solution')} value={form.solutionScore} onChange={v => setScore('solutionScore', v)} />
            <ScoreSelector label={t('communication')} value={form.communicationScore} onChange={v => setScore('communicationScore', v)} />
            <ScoreSelector label={t('closing')} value={form.closingScore} onChange={v => setScore('closingScore', v)} />
          </div>

          {/* Notes */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">{t('notes')}</h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('mistakes')}</label>
              <textarea value={form.mistakes} onChange={e => setForm({...form, mistakes: e.target.value})}
                rows={2} placeholder={t('mistakes_placeholder')}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('comment')}</label>
              <textarea value={form.comment} onChange={e => setForm({...form, comment: e.target.value})}
                rows={2} placeholder={t('comment_placeholder')}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/dialog-reviews" className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              {t('cancel')}
            </Link>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {mutation.isPending ? t('saving') : t('save_review')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
