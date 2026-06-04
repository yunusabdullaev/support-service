import { cn, STATUS_COLORS, PRIORITY_COLORS, SERVICE_STATUS_COLORS } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_COLORS[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge className={PRIORITY_COLORS[priority] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
      {priority}
    </Badge>
  );
}

export function ServiceStatusBadge({ status }: { status: string }) {
  const dotClass = {
    ONLINE: 'status-dot-green',
    DEGRADED: 'status-dot-yellow',
    OFFLINE: 'status-dot-red',
    UNKNOWN: 'status-dot-gray',
  }[status] || 'status-dot-gray';

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', SERVICE_STATUS_COLORS[status])}>
      <span className={dotClass} />
      {status}
    </span>
  );
}
