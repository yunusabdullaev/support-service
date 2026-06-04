'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product } from '@/types';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['CRM', 'SIPUNI', 'SARKOR', 'MODERATOR', 'COMMON_QUESTIONS', 'TROUBLESHOOTING', 'INTERNAL_RULES'];

export default function NewArticlePage() {
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

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/knowledge-base', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kb'] });
      router.push('/knowledge-base');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to create article'),
  });

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/knowledge-base" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-white">New Article</h1>
            <p className="text-slate-400 text-sm">Create a knowledge base article</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="glass-card p-6 space-y-5">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
            <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Article title"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Product</label>
              <select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
                className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">No specific product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Content *</label>
              <span className="text-xs text-slate-500">Markdown supported</span>
            </div>
            <textarea required value={form.content} onChange={e => setForm({...form, content: e.target.value})}
              rows={14} placeholder="# Article Title&#10;&#10;Write your article content here using Markdown...&#10;&#10;## Section 1&#10;Content here..."
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none font-mono" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
            <div className="flex gap-2">
              {['DRAFT', 'PUBLISHED'].map(s => (
                <button key={s} type="button" onClick={() => setForm({...form, status: s})}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.status === s
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/knowledge-base" className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">Cancel</Link>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {mutation.isPending ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
