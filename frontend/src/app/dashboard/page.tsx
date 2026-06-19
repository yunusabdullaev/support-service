'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { ServiceStatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { useProduct } from '@/lib/product';
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

function ProductBugChart() {
  const { data: bugs = [] } = useQuery<any[]>({
    queryKey: ['bugs'],
    queryFn: () => api.get('/bugs').then(r => r.data),
  });

  if (bugs.length === 0) return null;

  const days = 14;
  const now = new Date();
  const labels: string[] = [];
  const dateKeys: string[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
    labels.push(d.toLocaleDateString('uz', { day: 'numeric', month: 'short' }));
  }

  const productMap = new Map<string, string>();
  bugs.forEach((b: any) => { if (b.product) productMap.set(b.product.id, b.product.name); });
  const products = Array.from(productMap.entries());

  const productColors = [
    { line: '#818cf8', bg: 'rgba(129,140,248,0.1)', dot: '#6366f1', label: 'text-indigo-400' },
    { line: '#34d399', bg: 'rgba(52,211,153,0.1)', dot: '#10b981', label: 'text-emerald-400' },
    { line: '#fbbf24', bg: 'rgba(251,191,36,0.1)', dot: '#f59e0b', label: 'text-amber-400' },
    { line: '#f87171', bg: 'rgba(248,113,113,0.1)', dot: '#ef4444', label: 'text-red-400' },
    { line: '#a78bfa', bg: 'rgba(167,139,250,0.1)', dot: '#8b5cf6', label: 'text-purple-400' },
  ];

  const productData = products.map(([pid, pname], idx) => {
    const pBugs = bugs.filter((b: any) => b.product?.id === pid);
    const created = dateKeys.map(key => pBugs.filter((b: any) => b.createdAt.slice(0, 10) === key).length);
    const resolved = dateKeys.map(key =>
      pBugs.filter((b: any) => ['FIXED', 'CLOSED'].includes(b.status) && b.updatedAt.slice(0, 10) === key).length
    );
    const cumCreated = created.reduce<number[]>((acc, v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc; }, []);
    return {
      id: pid, name: pname, cumCreated,
      totalCreated: created.reduce((a, b) => a + b, 0),
      totalResolved: resolved.reduce((a, b) => a + b, 0),
      color: productColors[idx % productColors.length],
    };
  });

  const allValues = productData.flatMap(p => p.cumCreated);
  const maxVal = Math.max(...allValues, 1);
  const svgW = 700, svgH = 180, padL = 30, padR = 10, padT = 10, padB = 25;
  const chartW = svgW - padL - padR, chartH = svgH - padT - padB;
  const getX = (i: number) => padL + (i / (days - 1)) * chartW;
  const getY = (v: number) => padT + chartH - (v / maxVal) * chartH;

  const makePath = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(v)}`).join(' ');
  const makeArea = (data: number[]) =>
    `${makePath(data)} L${getX(days - 1)},${getY(0)} L${getX(0)},${getY(0)} Z`;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-300">Mahsulotlar bo'yicha xatolar (14 kun)</h3>
        <div className="flex items-center gap-4 text-[10px] text-slate-400">
          {productData.map(p => (
            <span key={p.id} className="flex items-center gap-1.5">
              <span className="w-3 h-[3px] rounded-full" style={{ background: p.color.line }} />
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 220 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line x1={padL} y1={getY(maxVal * ratio)} x2={svgW - padR} y2={getY(maxVal * ratio)} stroke="#1e293b" strokeWidth="1" />
            <text x={padL - 4} y={getY(maxVal * ratio) + 3} textAnchor="end" fontSize="8" fill="#475569">{Math.round(maxVal * ratio)}</text>
          </g>
        ))}
        {labels.map((label, i) => i % 2 === 0 && (
          <text key={i} x={getX(i)} y={svgH - 3} textAnchor="middle" fontSize="7" fill="#64748b">{label}</text>
        ))}
        {productData.map(p => (
          <g key={p.id}>
            <path d={makeArea(p.cumCreated)} fill={p.color.bg} />
            <path d={makePath(p.cumCreated)} fill="none" stroke={p.color.line} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {p.cumCreated.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill={p.color.dot} stroke="#0f172a" strokeWidth="1.5" opacity="0.8">
                <title>{`${p.name} — ${labels[i]}: jami ${v} ta xato`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>

      <div className={`grid grid-cols-${products.length} gap-3 mt-3 pt-3 border-t border-slate-800`}>
        {productData.map(p => (
          <div key={p.id} className="text-center p-2 bg-slate-800/30 rounded-lg">
            <p className={`text-sm font-bold ${p.color.label}`}>{p.name}</p>
            <div className="flex justify-center gap-4 mt-1">
              <div>
                <p className="text-sm font-bold text-slate-200">{p.totalCreated}</p>
                <p className="text-[9px] text-slate-500">Yaratilgan</p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400">{p.totalResolved}</p>
                <p className="text-[9px] text-slate-500">Hal qilingan</p>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-400">{p.totalCreated > 0 ? Math.round((p.totalResolved / p.totalCreated) * 100) : 0}%</p>
                <p className="text-[9px] text-slate-500">Daraja</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { selectedProductId } = useProduct();

  const getParams = () => selectedProductId ? `?productId=${selectedProductId}` : '';

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', selectedProductId],
    queryFn: () => api.get(`/dashboard/stats${getParams()}`).then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts', selectedProductId],
    queryFn: () => api.get(`/dashboard/charts${getParams()}`).then(r => r.data),
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

        {/* Product Bug Resolution Chart */}
        <ProductBugChart />

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
