'use client';

import React from 'react';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DialogReview } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';

function ScoreRow({ label, score, max = 2 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-slate-400 w-48 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-slate-300 w-10 text-right">{score}/{max}</span>
    </div>
  );
}

export default function DialogReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data: review, isLoading } = useQuery<DialogReview>({
    queryKey: ['review', id],
    queryFn: () => api.get(`/dialog-reviews/${id}`).then(r => r.data),
  });

  if (isLoading) return <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  if (!review) return <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}><div className="text-slate-400">Review not found</div></AppLayout>;

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dialog-reviews" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={review.status} />
              <span className="text-xs text-slate-500">{review.product?.name}</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {review.operator?.fullName} — {review.clientName}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{formatDate(review.reviewDate)} · Reviewed by {review.reviewedBy?.fullName}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{review.totalScore}</p>
            <p className="text-sm text-slate-500">/10 score</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Scores */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> Evaluation Scores
              </h3>
              <ScoreRow label="1. First Response Quality" score={review.firstResponseScore} />
              <ScoreRow label="2. Understanding Problem" score={review.understandingScore} />
              <ScoreRow label="3. Solution Quality" score={review.solutionScore} />
              <ScoreRow label="4. Communication Style" score={review.communicationScore} />
              <ScoreRow label="5. Closing the Dialog" score={review.closingScore} />
            </div>

            {/* Dialog */}
            {review.dialogText && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Dialog Transcript
                </h3>
                <div className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-900/60 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs leading-relaxed">
                  {review.dialogText}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {review.mistakes && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-red-400 mb-2">❌ Mistakes Found</h3>
                <p className="text-sm text-slate-300">{review.mistakes}</p>
              </div>
            )}
            {review.comment && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">💬 Comment</h3>
                <p className="text-sm text-slate-300">{review.comment}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
