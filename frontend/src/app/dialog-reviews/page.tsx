'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DialogReview, User } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useProduct } from '@/lib/product';
import { Plus, Star } from 'lucide-react';
import Link from 'next/link';

function ScoreBar({ score, max = 2 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{score}/{max}</span>
    </div>
  );
}

export default function DialogReviewsPage() {
  const { t } = useI18n();
  const { selectedProductId } = useProduct();
  const [operatorFilter, setOperatorFilter] = useState('');

  const { data: reviews = [], isLoading } = useQuery<DialogReview[]>({
    queryKey: ['reviews', operatorFilter, selectedProductId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (operatorFilter) params.set('operatorId', operatorFilter);
      if (selectedProductId) params.set('productId', selectedProductId);
      return api.get(`/dialog-reviews?${params.toString()}`).then(r => r.data);
    },
    refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const operators = users.filter(u => u.role === 'OPERATOR');
  const avgScore = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.totalScore, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('dialog_reviews')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {reviews.length} {t('reviews_count')} · {t('avg_score')}: <span className="text-yellow-400 font-semibold">{avgScore}/10</span>
            </p>
          </div>
          <Link href="/dialog-reviews/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> {t('new_review')}
          </Link>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <label className="text-sm text-slate-400">{t('filter_operator')}</label>
          <select value={operatorFilter} onChange={e => setOperatorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{t('all_operators')}</option>
            {operators.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl flex flex-col items-center justify-center h-48 text-slate-500">
              <Star className="w-8 h-8 mb-2" />
              <p>{t('no_reviews')}</p>
            </div>
          ) : reviews.map(review => (
            <Link key={review.id} href={`/dialog-reviews/${review.id}`} className="block group">
              <div className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/70 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
                <div className="flex items-start gap-4">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-[15px] font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {review.operator?.fullName}
                      </h3>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-500">{review.clientName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {[
                        { label: t('first_response_short') || 'Birinchi javob', score: review.firstResponseScore },
                        { label: t('understanding_short') || 'Tushunish', score: review.understandingScore },
                        { label: t('solution_short') || 'Yechim', score: review.solutionScore },
                        { label: t('communication_short') || 'Muloqot', score: review.communicationScore },
                        { label: t('closing_short') || 'Yakunlash', score: review.closingScore },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${item.score === 2 ? 'bg-emerald-400' : item.score === 1 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                          <span className="text-[10px] text-slate-500">{item.score}/2</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Meta info */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Score */}
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                      <span className={`text-lg font-bold ${review.totalScore >= 8 ? 'text-emerald-400' : review.totalScore >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {review.totalScore}
                      </span>
                      <span className="text-xs text-slate-600">/10</span>
                    </div>

                    {/* Product */}
                    {review.product && (
                      <div className="w-16 flex justify-center">
                        <span className="text-[10px] font-medium text-indigo-400/90 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          {review.product.name}
                        </span>
                      </div>
                    )}

                    {/* Status */}
                    <div className="w-24 flex justify-center">
                      <StatusBadge status={review.status} />
                    </div>

                    {/* Date */}
                    <div className="w-28 text-right">
                      <div className="text-[11px] text-slate-500">{formatDate(review.reviewDate)}</div>
                      {review.reviewedBy && (
                        <div className="text-[10px] text-slate-600 mt-0.5">{review.reviewedBy.fullName}</div>
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
