'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { ServiceStatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  Bug, AlertTriangle, Star, Activity, Server, Lightbulb, TrendingUp, Clock, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const chartTooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="glass-card p-5 hover:border-slate-600 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs text-emerald-400 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => api.get('/dashboard/charts').then(r => r.data),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('dashboard_title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('dashboard_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {t('last_updated')}: {formatDateTime(new Date())}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title={t('open_bugs')} value={stats?.openBugs ?? 0} icon={Bug} color="bg-orange-500/20 text-orange-400" />
          <StatCard title={t('critical_bugs')} value={stats?.criticalBugs ?? 0} icon={AlertTriangle} color="bg-red-500/20 text-red-400" />
          <StatCard
            title={t('avg_qa_score')}
            value={`${stats?.averageQaScore ?? 0}/10`}
            subtitle={`${stats?.reviewedDialogs ?? 0} ${t('reviewed')}`}
            icon={Star} color="bg-yellow-500/20 text-yellow-400"
          />
          <StatCard
            title={t('active_incidents')}
            value={stats?.activeIncidents ?? 0}
            subtitle={`${stats?.weekIncidents ?? 0} ${t('this_week')}`}
            icon={Zap} color="bg-purple-500/20 text-purple-400"
          />
          <StatCard
            title={t('services_online')}
            value={`${stats?.servicesOnline ?? 0}/${stats?.totalServices ?? 0}`}
            icon={Server} color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            title={t('improvements')}
            value={stats?.newImprovements ?? 0}
            subtitle={t('pending_review')}
            icon={Lightbulb} color="bg-blue-500/20 text-blue-400"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">{t('bugs_per_day')}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={charts?.bugsPerDay || []}>
                <defs>
                  <linearGradient id="bugGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#bugGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">{t('qa_score_weekly')}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={charts?.qaPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="avgScore" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Services + Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> {t('service_status')}
            </h3>
            <div className="space-y-3">
              {stats?.services?.map(service => (
                <div key={service.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{service.name}</p>
                    {service.responseTimeMs && (
                      <p className="text-xs text-slate-500">{service.responseTimeMs}ms</p>
                    )}
                  </div>
                  <ServiceStatusBadge status={service.currentStatus} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 col-span-2">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">{t('incidents_weekly')}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={charts?.incidentsPerWeek || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
