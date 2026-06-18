'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { KnowledgeArticle, Product } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['CRM', 'SIPUNI', 'SARKOR', 'MODERATOR', 'COMMON_QUESTIONS', 'TROUBLESHOOTING', 'INTERNAL_RULES'];

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    productId: '',
    category: 'COMMON_QUESTIONS',
    content: '',
    status: 'PUBLISHED',
  });
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const { data: article, isLoading } = useQuery<KnowledgeArticle>({
    queryKey: ['article', id],
    queryFn: () => api.get(`/knowledge-base/${id}`).then(r => r.data),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  useEffect(() => {
    if (article && !loaded) {
      setForm({
        title: article.title,
        productId: article.product?.id || '',
        category: article.category,
        content: article.content,
        status: article.status,
      });
      setLoaded(true);
    }
  }, [article, loaded]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.patch(`/knowledge-base/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb'] });
      qc.invalidateQueries({ queryKey: ['article', id] });
      router.push(`/knowledge-base/${id}`);
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Saqlashda xatolik'),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/knowledge-base/${id}`} className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Maqolani tahrirlash</h1>
            <p className="text-slate-400 text-sm mt-0.5">Bilim bazasi maqolasini o'zgartirish</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="glass-card p-6 space-y-5">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Sarlavha *</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Maqola sarlavhasi"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Kategoriya</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Mahsulot</label>
              <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Mahsulot tanlanmagan</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Kontent *</label>
              <span className="text-xs text-slate-500">Markdown qo'llab-quvvatlanadi</span>
            </div>
            <textarea required value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              rows={14} placeholder="# Sarlavha&#10;&#10;Maqola kontenti..."
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none font-mono" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <div className="flex gap-2">
              {['DRAFT', 'PUBLISHED', 'ARCHIVED'].map(s => (
                <button key={s} type="button" onClick={() => setForm({...form, status: s})}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.status === s
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href={`/knowledge-base/${id}`} className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
              Bekor qilish
            </Link>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saqlanmoqda...</>
              ) : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
