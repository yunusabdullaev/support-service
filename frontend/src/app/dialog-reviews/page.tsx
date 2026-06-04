'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DialogReview, User } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
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
  const [operatorFilter, setOperatorFilter] = useState('');

  const { data: reviews = [], isLoading } = useQuery<DialogReview[]>({
    queryKey: ['reviews', operatorFilter],
    queryFn: () => {
      const params = operatorFilter ? `?operatorId=${operatorFilter}` : '';
      return api.get(`/dialog-reviews${params}`).then(r => r.data);
    },
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

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({length: 6}).map((_, i) => (
              <div key={i} className="glass-card p-5 h-48 animate-pulse">
                <div className="h-4 bg-slate-800 rounded mb-3 w-3/4" />
                <div className="h-3 bg-slate-800 rounded mb-2 w-1/2" />
              </div>
            ))
          ) : reviews.map(review => (
            <Link key={review.id} href={`/dialog-reviews/${review.id}`}>
              <div className="glass-card p-5 hover:border-slate-600 transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{review.operator?.fullName}</p>
                    <p className="text-xs text-slate-500">{review.clientName} · {formatDate(review.reviewDate)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold ${review.totalScore >= 8 ? 'text-emerald-400' : review.totalScore >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {review.totalScore}
                    </span>
                    <span className="text-slate-500 text-sm">/10</span>
                  </div>
                </div>
                <div className="space-y-1.5 mb-3">
                  <ScoreBar score={review.firstResponseScore} />
                  <ScoreBar score={review.understandingScore} />
                  <ScoreBar score={review.solutionScore} />
                  <ScoreBar score={review.communicationScore} />
                  <ScoreBar score={review.closingScore} />
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={review.status} />
                  <span className="text-xs text-slate-500">{review.product?.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
