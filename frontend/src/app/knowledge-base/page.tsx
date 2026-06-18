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
import { Plus, Search, BookOpen, Clock } from 'lucide-react';
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
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              {t('knowledge_base')}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{articles.length} {t('articles_count')}</p>
          </div>
          <Link href="/knowledge-base/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-indigo-900/30 hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-4 h-4" /> {t('new_article')}
          </Link>
        </div>

        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
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

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl flex flex-col items-center justify-center h-48 text-slate-500">
              <BookOpen className="w-8 h-8 mb-2" />
              <p>{t('no_articles')}</p>
            </div>
          ) : filtered.map(article => (
            <Link key={article.id} href={`/knowledge-base/${article.id}`} className="block group">
              <div className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/70 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
                <div className="flex items-start gap-4">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">{article.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400/80 line-clamp-2 leading-relaxed">
                      {article.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                    </p>
                  </div>

                  {/* Right: Meta info */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Category */}
                    <div className="w-32 flex justify-center">
                      <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {article.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-24 flex justify-center">
                      <StatusBadge status={article.status} />
                    </div>

                    {/* Created info */}
                    <div className="w-28 text-right">
                      <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />{formatDate(article.createdAt)}
                      </div>
                      {article.createdBy && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] text-slate-600">{article.createdBy.fullName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
