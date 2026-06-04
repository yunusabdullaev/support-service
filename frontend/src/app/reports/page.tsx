'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart3, Download, Bug, Star, AlertTriangle, Activity, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const chartTooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

export default function ReportsPage() {
  const { data: bugReport = [] } = useQuery({
    queryKey: ['reports-bugs'],
    queryFn: () => api.get('/reports/bugs').then(r => r.data),
  });

  const { data: qualityReport = [] } = useQuery({
    queryKey: ['reports-quality'],
    queryFn: () => api.get('/reports/quality').then(r => r.data),
  });

  const { data: uptimeReport = [] } = useQuery({
    queryKey: ['reports-uptime'],
    queryFn: () => api.get('/reports/uptime').then(r => r.data),
  });

  // Compute bug stats by priority
  const bugsByPriority = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => ({
    name: p,
    count: bugReport.filter((b: any) => b.priority === p).length,
  })).filter(x => x.count > 0);

  // Bug status pie
  const bugsByStatus = ['NEW', 'CONFIRMED', 'IN_PROGRESS', 'FIXED', 'CLOSED'].map(s => ({
    name: s.replace(/_/g, ' '),
    value: bugReport.filter((b: any) => b.status === s).length,
  })).filter(x => x.value > 0);

  // Quality per operator
  const operatorMap: Record<string, { scores: number[]; name: string }> = {};
  qualityReport.forEach((r: any) => {
    const id = r.operator?.id;
    if (!id) return;
    if (!operatorMap[id]) operatorMap[id] = { scores: [], name: r.operator.fullName };
    operatorMap[id].scores.push(r.totalScore);
  });
  const operatorQuality = Object.values(operatorMap).map(({ name, scores }) => ({
    name: name.split(' ')[0],
    avg: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    count: scores.length,
  }));

  const handleExportExcel = () => {
    window.open('http://localhost:4000/reports/export/excel', '_blank');
  };

  const handleExportPdf = () => {
    window.open('http://localhost:4000/reports/export/pdf', '_blank');
  };

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-slate-400 text-sm mt-0.5">Analytics and export tools</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Excel (Bugs)
            </button>
            <button onClick={handleExportPdf}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors">
              <Download className="w-4 h-4" /> PDF (QA)
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Bugs', value: bugReport.length, icon: Bug, color: 'text-orange-400' },
            { label: 'QA Reviews', value: qualityReport.length, icon: Star, color: 'text-yellow-400' },
            { label: 'Avg QA Score', value: qualityReport.length > 0
              ? (qualityReport.reduce((s: number, r: any) => s + r.totalScore, 0) / qualityReport.length).toFixed(1)
              : 0, icon: Activity, color: 'text-emerald-400' },
            { label: 'Monitored Services', value: uptimeReport.length, icon: BarChart3, color: 'text-indigo-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bugs by Priority */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Bugs by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bugsByPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {bugsByPriority.map((entry, i) => (
                    <Cell key={i} fill={entry.name === 'CRITICAL' ? '#ef4444' : entry.name === 'HIGH' ? '#f97316' : entry.name === 'MEDIUM' ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bugs by Status Pie */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Bugs by Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bugsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                  {bugsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Operator Quality */}
          {operatorQuality.length > 0 && (
            <div className="glass-card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" /> Operator QA Performance
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={operatorQuality} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v, name) => [`${v}/10`, 'Avg Score']} />
                  <Bar dataKey="avg" fill="#6366f1" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
