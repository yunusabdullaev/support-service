'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { ChevronLeft, ChevronRight, Plus, X, Sun, Sunset, Moon, Calendar } from 'lucide-react';

interface ShiftAssignment {
  id: string;
  date: string;
  shiftType: 'MORNING' | 'EVENING' | 'NIGHT';
  userId: string;
  note?: string;
  user: {
    id: string;
    fullName: string;
    role: string;
  };
}

const SHIFT_CONFIG = {
  MORNING: {
    label: 'Kunduzgi',
    time: '09:00 – 17:00',
    icon: Sun,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  EVENING: {
    label: 'Kechki',
    time: '17:00 – 01:00',
    icon: Sunset,
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  NIGHT: {
    label: 'Tungi',
    time: '01:00 – 09:00',
    icon: Moon,
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
};

const SHIFT_TYPES: ('MORNING' | 'EVENING' | 'NIGHT')[] = ['MORNING', 'EVENING', 'NIGHT'];

function getWeekDates(offset: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

const DAY_NAMES = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'];
const MONTH_NAMES = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];

export default function ShiftsPage() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [addingCell, setAddingCell] = useState<{ date: string; shift: string } | null>(null);

  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_LEADER';

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const from = formatDateKey(weekDates[0]);
  const to = formatDateKey(weekDates[6]);

  const { data: shifts = [], isLoading } = useQuery<ShiftAssignment[]>({
    queryKey: ['shifts', from, to],
    queryFn: () => api.get(`/shifts?from=${from}&to=${to}`).then(r => r.data),
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const operators = users.filter(u => u.role === 'OPERATOR' && u.isActive);

  const createMutation = useMutation({
    mutationFn: (data: { date: string; shiftType: string; userId: string }) =>
      api.post('/shifts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
      setAddingCell(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });

  // Group shifts by date+shiftType
  const shiftMap = useMemo(() => {
    const map: Record<string, ShiftAssignment[]> = {};
    for (const s of shifts) {
      const key = `${s.date.split('T')[0]}_${s.shiftType}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [shifts]);

  const today = formatDateKey(new Date());

  // Month label
  const monthLabel = (() => {
    const m1 = weekDates[0].getMonth();
    const m2 = weekDates[6].getMonth();
    const y = weekDates[0].getFullYear();
    if (m1 === m2) return `${MONTH_NAMES[m1]} ${y}`;
    return `${MONTH_NAMES[m1]} – ${MONTH_NAMES[m2]} ${y}`;
  })();

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER', 'OPERATOR']}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('nav_shifts') || 'Smen jadvali'}</h1>
              <p className="text-slate-400 text-sm mt-0.5">{monthLabel}</p>
            </div>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Bu hafta
            </button>
            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, dayIdx) => {
              const dateKey = formatDateKey(date);
              const isToday = dateKey === today;

              return (
                <div
                  key={dateKey}
                  className={`rounded-xl border transition-all ${
                    isToday
                      ? 'border-indigo-500/50 bg-indigo-500/5'
                      : 'border-slate-700/50 bg-slate-800/30'
                  }`}
                >
                  {/* Day Header */}
                  <div className={`px-3 py-2.5 text-center border-b ${
                    isToday ? 'border-indigo-500/30' : 'border-slate-700/30'
                  }`}>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                      {DAY_NAMES[dayIdx]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${
                      isToday ? 'text-indigo-400' : 'text-slate-200'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Shifts */}
                  <div className="p-1.5 space-y-1.5">
                    {SHIFT_TYPES.map(shiftType => {
                      const config = SHIFT_CONFIG[shiftType];
                      const Icon = config.icon;
                      const key = `${dateKey}_${shiftType}`;
                      const assigned = shiftMap[key] || [];
                      const isAdding = addingCell?.date === dateKey && addingCell?.shift === shiftType;

                      return (
                        <div
                          key={shiftType}
                          className={`rounded-lg p-2 ${config.bg} border ${config.border} min-h-[52px]`}
                        >
                          {/* Shift label */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Icon className={`w-2.5 h-2.5 ${config.text}`} />
                              <span className={`text-[9px] font-medium ${config.text}`}>
                                {config.time}
                              </span>
                            </div>
                            {canManage && !isAdding && (
                              <button
                                onClick={() => setAddingCell({ date: dateKey, shift: shiftType })}
                                className={`w-4 h-4 rounded flex items-center justify-center ${config.text} hover:bg-white/10 transition-colors`}
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>

                          {/* Assigned operators */}
                          <div className="space-y-1">
                            {assigned.map(a => (
                              <div
                                key={a.id}
                                className="group flex items-center gap-1.5 bg-black/20 rounded-md px-1.5 py-1"
                              >
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0">
                                  {a.user.fullName.charAt(0)}
                                </div>
                                <span className="text-[10px] text-slate-300 truncate flex-1">
                                  {a.user.fullName.split(' ')[0]}
                                </span>
                                {canManage && (
                                  <button
                                    onClick={() => deleteMutation.mutate(a.id)}
                                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Inline add dropdown */}
                            {isAdding && (
                              <div className="relative">
                                <select
                                  autoFocus
                                  className="w-full text-[10px] px-1.5 py-1 bg-slate-900 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  defaultValue=""
                                  onChange={e => {
                                    if (e.target.value) {
                                      createMutation.mutate({
                                        date: dateKey,
                                        shiftType,
                                        userId: e.target.value,
                                      });
                                    }
                                  }}
                                  onBlur={() => setAddingCell(null)}
                                >
                                  <option value="">Tanlang...</option>
                                  {operators
                                    .filter(op => !assigned.some(a => a.userId === op.id))
                                    .map(op => (
                                      <option key={op.id} value={op.id}>
                                        {op.fullName}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}

                            {assigned.length === 0 && !isAdding && (
                              <div className="text-[9px] text-slate-600 italic text-center py-0.5">
                                —
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 justify-center pt-2">
          {SHIFT_TYPES.map(type => {
            const config = SHIFT_CONFIG[type];
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${config.text}`} />
                <span className="text-xs text-slate-400">{config.label}</span>
                <span className="text-[10px] text-slate-600">({config.time})</span>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
