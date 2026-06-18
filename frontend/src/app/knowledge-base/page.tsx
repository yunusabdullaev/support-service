'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { KnowledgeArticle } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useProduct } from '@/lib/product';
import { Plus, Search, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = ['CRM', 'SIPUNI', 'SARKOR', 'MODERATOR', 'COMMON_QUESTIONS', 'TROUBLESHOOTING', 'INTERNAL_RULES'];

export default function KnowledgeBasePage() {
  const { t } = useI18n();
  const { selectedProductId } = useProduct();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: articles = [], isLoading } = useQuery<KnowledgeArticle[]>({
    queryKey: ['kb', category, selectedProductId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (selectedProductId) params.set('productId', selectedProductId);
      return api.get(`/knowledge-base?${params.toString()}`).then(r => r.data);
    },
  });

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('knowledge_base')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{articles.length} {t('articles_count')}</p>
          </div>
          <Link href="/knowledge-base/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> {t('new_article')}
          </Link>
        </div>

        <div className="glass-card p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder={t('search_articles')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!category ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {t('all')}
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center h-48 text-slate-500">
              <BookOpen className="w-8 h-8 mb-2" />
              <p>{t('no_articles')}</p>
            </div>
          ) : filtered.map(article => (
            <Link key={article.id} href={`/knowledge-base/${article.id}`}>
              <div className="glass-card p-4 flex items-center gap-4 hover:border-slate-600 transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{article.category.replace(/_/g, ' ')}</span>
                    {article.product && <span className="text-xs text-slate-600">{article.product.name}</span>}
                    <StatusBadge status={article.status} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">{article.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('by')} {article.createdBy?.fullName} · {formatDate(article.createdAt)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
