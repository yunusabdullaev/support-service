'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ServiceMonitor, Incident } from '@/types';
import { ServiceStatusBadge, StatusBadge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { Server } from 'lucide-react';
import Link from 'next/link';

export default function MonitoringPage() {
  const { t } = useI18n();

  const { data: monitors = [], isLoading } = useQuery<ServiceMonitor[]>({
    queryKey: ['monitors'],
    queryFn: () => api.get('/monitoring').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: incidents = [] } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => api.get('/incidents').then(r => r.data),
    refetchInterval: 30000,
  });

  const online = monitors.filter(m => m.currentStatus === 'ONLINE').length;
  const degraded = monitors.filter(m => m.currentStatus === 'DEGRADED').length;
  const offline = monitors.filter(m => m.currentStatus === 'OFFLINE').length;
  const openIncidents = incidents.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('monitoring_title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('monitoring_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('auto_refresh')}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t('online'), count: online, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: t('degraded'), count: degraded, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { label: t('offline'), count: offline, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: t('open_incidents'), count: openIncidents, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className={`glass-card p-4 border ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('services')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              Array.from({length: 4}).map((_, i) => (
                <div key={i} className="glass-card p-5 h-32 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded mb-3 w-1/2" />
                </div>
              ))
            ) : monitors.map(monitor => (
              <div key={monitor.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-white">{monitor.name}</h3>
                  </div>
                  <ServiceStatusBadge status={monitor.currentStatus} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 mb-0.5">{t('url')}</p>
                    <p className="text-slate-400 truncate">{monitor.url.replace(/^https?:\/\//, '')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">{t('response_time')}</p>
                    <p className={`font-medium ${!monitor.responseTimeMs ? 'text-slate-500' : monitor.responseTimeMs > 2000 ? 'text-red-400' : monitor.responseTimeMs > 1000 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {monitor.responseTimeMs ? `${monitor.responseTimeMs}ms` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">{t('last_check')}</p>
                    <p className="text-slate-400">{monitor.lastCheckedAt ? formatDateTime(monitor.lastCheckedAt) : '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('recent_incidents')}</h2>
            <Link href="/incidents" className="text-xs text-indigo-400 hover:text-indigo-300">{t('view_all')}</Link>
          </div>
          <div className="glass-card overflow-hidden">
            {incidents.slice(0, 5).map((incident, i) => (
              <div key={incident.id} className={`p-4 flex items-start gap-3 ${i < Math.min(incidents.length, 5) - 1 ? 'border-b border-slate-800/50' : ''}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${incident.severity === 'CRITICAL' ? 'bg-red-500' : incident.severity === 'HIGH' ? 'bg-orange-500' : incident.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{incident.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{incident.serviceMonitor?.name} · {formatDateTime(incident.startedAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={incident.status} />
                  {incident.durationMinutes && <p className="text-xs text-slate-500 mt-1">{formatDuration(incident.durationMinutes)}</p>}
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">{t('no_incidents')}</div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
