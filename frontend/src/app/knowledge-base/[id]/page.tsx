'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { KnowledgeArticle } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: article, isLoading } = useQuery<KnowledgeArticle>({
    queryKey: ['article', id],
    queryFn: () => api.get(`/knowledge-base/${id}`).then(r => r.data),
  });

  if (isLoading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  if (!article) return <AppLayout><div className="text-slate-400">Article not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/knowledge-base" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><ArrowLeft className="w-4 h-4" /></Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">{article.category.replace(/_/g, ' ')}</span>
              {article.product && <span className="text-xs text-slate-500">{article.product.name}</span>}
              <StatusBadge status={article.status} />
            </div>
            <h1 className="text-xl font-bold text-white">{article.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              By {article.createdBy?.fullName} · Updated {formatDateTime(article.updatedAt)}
            </p>
          </div>
          <Link href={`/knowledge-base/${article.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>

        <div className="glass-card p-6">
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-slate-200 prose-headings:font-semibold
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
            prose-code:text-indigo-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
            prose-blockquote:border-l-indigo-500 prose-blockquote:text-slate-400
            prose-li:text-slate-300
            prose-hr:border-slate-800
            prose-strong:text-slate-200">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
