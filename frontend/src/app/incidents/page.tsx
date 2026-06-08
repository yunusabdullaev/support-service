'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Incident } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

import { useProduct } from '@/lib/product';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500', HIGH: 'bg-orange-500', MEDIUM: 'bg-yellow-500', LOW: 'bg-blue-500',
};

export default function IncidentsPage() {
  const { t } = useI18n();
  const { selectedProductId } = useProduct();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents', selectedProductId],
    queryFn: () => api.get('/incidents', {
      params: selectedProductId ? { productId: selectedProductId } : undefined
    }).then(r => r.data),
    refetchInterval: 5000,
  });

  const open = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
  const resolved = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED');

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('incidents_title')}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{open.length} {t('open_count')} · {resolved.length} {t('resolved_count')}</p>
        </div>

        {open.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {t('active_incidents_title')}
            </h2>
            <div className="space-y-3">
              {open.map(incident => (
                <div key={incident.id} className="glass-card p-5 border-red-500/20">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 animate-pulse ${SEVERITY_COLORS[incident.severity]}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30">{incident.severity}</span>
                            <span className="text-xs text-slate-500">{incident.serviceMonitor?.name}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-white">{incident.title}</h3>
                          {incident.description && <p className="text-sm text-slate-400 mt-1">{incident.description}</p>}
                        </div>
                        <StatusBadge status={incident.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(incident.startedAt)}</span>
                        {incident.responsibleUser && <span>{t('assigned')}: {incident.responsibleUser.fullName}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {t('resolved_incidents')}
          </h2>
          <div className="glass-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : resolved.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8">{t('no_resolved')}</div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {resolved.map(incident => (
                  <div key={incident.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SEVERITY_COLORS[incident.severity]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300">{incident.title}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span>{incident.serviceMonitor?.name}</span>
                          <span>{formatDateTime(incident.startedAt)}</span>
                          {incident.durationMinutes && <span>{t('duration')}: {formatDuration(incident.durationMinutes)}</span>}
                        </div>
                      </div>
                      <StatusBadge status={incident.status} />
                    </div>
                    {incident.rootCause && (
                      <p className="text-xs text-slate-500 mt-2 ml-5 pl-2 border-l border-slate-700">
                        📌 {incident.rootCause}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
