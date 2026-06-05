'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Package, Bug, TrendingUp, Zap, ChevronDown } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  NEW:          'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONFIRMED:    'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  IN_PROGRESS:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  WAITING:      'bg-slate-500/20 text-slate-400 border-slate-500/30',
  FIXED:        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CLOSED:       'bg-slate-600/20 text-slate-500 border-slate-600/30',
  REJECTED:     'bg-red-500/20 text-red-400 border-red-500/30',
  OPEN:         'bg-orange-500/20 text-orange-400 border-orange-500/30',
  UNDER_REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  PLANNED:      'bg-teal-500/20 text-teal-400 border-teal-500/30',
  IMPLEMENTED:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${STATUS_COLORS[status] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function ProductSection() {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [activeTab, setActiveTab] = useState<'bugs' | 'improvements' | 'difficulties'>('bugs');

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const { data: bugs = [], isLoading: bugsLoading } = useQuery<any[]>({
    queryKey: ['product-bugs', selectedProductId],
    queryFn: () => api.get(`/bugs?productId=${selectedProductId}`).then(r => r.data),
    enabled: !!selectedProductId,
  });

  const { data: improvements = [], isLoading: imprLoading } = useQuery<any[]>({
    queryKey: ['product-improvements', selectedProductId],
    queryFn: () => api.get(`/improvements?productId=${selectedProductId}`).then(r => r.data),
    enabled: !!selectedProductId,
  });

  const { data: difficulties = [], isLoading: diffLoading } = useQuery<any[]>({
    queryKey: ['product-difficulties', selectedProductId],
    queryFn: () => api.get(`/difficulties?productId=${selectedProductId}`).then(r => r.data),
    enabled: !!selectedProductId,
  });

  const openBugs = bugs.filter((b: any) => !['CLOSED', 'REJECTED', 'FIXED'].includes(b.status)).length;
  const openImpr = improvements.filter((i: any) => !['CLOSED', 'IMPLEMENTED'].includes(i.status)).length;
  const openDiff = difficulties.filter((d: any) => !['CLOSED', 'FIXED'].includes(d.status)).length;

  const tabs = [
    { key: 'bugs' as const,         label: 'Xatolar',         count: bugs.length,         icon: Bug,        color: 'text-red-400'   },
    { key: 'improvements' as const,  label: "Takliflar",       count: improvements.length,  icon: TrendingUp, color: 'text-blue-400'  },
    { key: 'difficulties' as const,  label: 'Qiyinchiliklar',  count: difficulties.length,  icon: Zap,        color: 'text-amber-400' },
  ];

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <Package className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Mahsulot ma'lumotlari</h2>
          <p className="text-xs text-slate-500">Mahsulot bo'yicha barcha ma'lumotlarni ko'ring</p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="relative mb-5">
        <select
          value={selectedProductId}
          onChange={e => { setSelectedProductId(e.target.value); setActiveTab('bugs'); }}
          className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm appearance-none cursor-pointer"
        >
          <option value="">— Mahsulotni tanlang —</option>
          {products.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>

      {/* Empty state */}
      {!selectedProductId ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
          <Package className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Ko'rish uchun mahsulotni tanlang</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Xatolar',         total: bugs.length,         open: openBugs, colorClass: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20' },
              { label: 'Takliflar',        total: improvements.length, open: openImpr, colorClass: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Qiyinchiliklar',  total: difficulties.length, open: openDiff, colorClass: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(s => (
              <div key={s.label} className={`border rounded-xl p-4 ${s.bg}`}>
                <div className={`text-2xl font-bold ${s.colorClass}`}>{s.total}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                {s.open > 0 && (
                  <div className={`text-xs mt-1 ${s.colorClass} opacity-70`}>{s.open} ta ochiq</div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-800/40 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${tab.color}`} />
                {tab.label}
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.key ? 'bg-violet-500/30 text-violet-300' : 'bg-slate-700 text-slate-500'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">

            {/* BUGS */}
            {activeTab === 'bugs' && (
              bugsLoading
                ? <p className="text-center py-8 text-slate-600 text-sm">Yuklanmoqda...</p>
                : bugs.length === 0
                  ? <p className="text-center py-8 text-slate-600 text-sm">Bu mahsulotda xatolar yo'q</p>
                  : bugs.map((b: any) => (
                    <div key={b.id} className="flex items-start justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium truncate">{b.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {b.clientPhone && <span className="text-[10px] font-mono text-emerald-400/80">📞 +{b.clientPhone}</span>}
                          <span className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                        <StatusPill status={b.status} />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          b.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          b.priority === 'HIGH'     ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                          b.priority === 'MEDIUM'   ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                      'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>{b.priority}</span>
                      </div>
                    </div>
                  ))
            )}

            {/* IMPROVEMENTS */}
            {activeTab === 'improvements' && (
              imprLoading
                ? <p className="text-center py-8 text-slate-600 text-sm">Yuklanmoqda...</p>
                : improvements.length === 0
                  ? <p className="text-center py-8 text-slate-600 text-sm">Bu mahsulotda takliflar yo'q</p>
                  : improvements.map((i: any) => (
                    <div key={i.id} className="flex items-start justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium truncate">{i.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{i.description}</p>
                        <span className="text-[10px] text-slate-500">{new Date(i.createdAt).toLocaleDateString('uz-UZ')}</span>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <StatusPill status={i.status} />
                      </div>
                    </div>
                  ))
            )}

            {/* DIFFICULTIES */}
            {activeTab === 'difficulties' && (
              diffLoading
                ? <p className="text-center py-8 text-slate-600 text-sm">Yuklanmoqda...</p>
                : difficulties.length === 0
                  ? <p className="text-center py-8 text-slate-600 text-sm">Bu mahsulotda qiyinchiliklar yo'q</p>
                  : difficulties.map((d: any) => (
                    <div key={d.id} className="flex items-start justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 font-medium truncate">{d.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{d.description}</p>
                        <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString('uz-UZ')}</span>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <StatusPill status={d.status} />
                      </div>
                    </div>
                  ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
