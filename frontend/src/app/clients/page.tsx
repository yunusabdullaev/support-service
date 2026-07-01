'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { useProduct } from '@/lib/product';
import { formatDateTime } from '@/lib/utils';
import {
  Plus, Search, UserCheck, Phone, MapPin, Briefcase,
  Building2, Edit3, Trash2, X, Save, AlertCircle, Download, Megaphone,
  Package, Clock, User2, Calculator
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
}

interface Client {
  id: string;
  fullName: string;
  phone: string;
  direction?: string;
  position?: string;
  location?: string;
  branchCount: number;
  employeeCount: number;
  referredFrom?: string;
  note?: string;
  isActive: boolean;
  createdAt: string;
  productId?: string;
  installationStatus: string;
  bitrixStatus: string;
  createdBy?: {
    id: string;
    fullName: string;
    role: string;
  };
  product?: {
    id: string;
    name: string;
  };
}

function calculateTariff(employeeCount: number): number {
  if (employeeCount <= 3) return 500000;
  return 500000 + (employeeCount - 3) * 100000;
}

function formatSum(amount: number): string {
  return amount.toLocaleString('uz-UZ') + ' so\'m';
}

const INSTALLATION_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  INSTALLED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const BITRIX_STATUS_COLORS: Record<string, string> = {
  NOT_ADDED: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  ADDED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function ClientsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { selectedProductId } = useProduct();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (selectedProductId) params.set('productId', selectedProductId);

    const token = localStorage.getItem('token');
    if (token) params.set('token', token);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${API_URL}/clients/export/excel?${params.toString()}`, '_blank');
  };
  const [editClient, setEditClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients', search, fromDate, toDate, selectedProductId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (selectedProductId) params.set('productId', selectedProductId);
      return api.get(`/clients?${params.toString()}`).then(r => r.data);
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setDeleteId(null); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => api.patch(`/clients/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setEditClient(null); },
  });

  const getInstallationLabel = (status: string) => {
    const map: Record<string, string> = {
      NEW: t('installation_new'),
      IN_PROGRESS: t('installation_in_progress'),
      INSTALLED: t('installation_installed'),
    };
    return map[status] || status;
  };

  const getBitrixLabel = (status: string) => {
    const map: Record<string, string> = {
      NOT_ADDED: t('bitrix_not_added'),
      ADDED: t('bitrix_added'),
    };
    return map[status] || status;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('nav_clients')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{clients.length} {t('clients_count')}</p>
          </div>
          <div className="flex gap-2">
            {(user?.role === 'TEAM_LEADER' || user?.role === 'ADMIN') && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-950/20"
              >
                <Download className="w-4 h-4" /> {t('export_excel')}
              </button>
            )}
            <Link
              href="/clients/new"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> {t('new_client')}
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('client_search_placeholder')}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} title={t('date_from')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="text-slate-600 text-xs">-</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} title={t('date_to')}
              className="px-2.5 py-1.5 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center h-48 text-slate-500">
            <UserCheck className="w-8 h-8 mb-2" />
            <p>{t('no_clients')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {clients.map(client => (
              <div key={client.id} className="glass-card p-5 hover:border-slate-600 transition-all duration-200">
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar + name */}
                  <Link href={`/clients/${client.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {client.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{client.fullName}</h3>
                      {client.position && (
                        <p className="text-xs text-slate-400 truncate">{client.position}</p>
                      )}
                    </div>
                  </Link>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditClient(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-colors"
                      title={t('edit')}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(client.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status badges row */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {client.product && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                      <Package className="w-3 h-3" />
                      {client.product.name}
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${INSTALLATION_STATUS_COLORS[client.installationStatus] || ''}`}>
                    {getInstallationLabel(client.installationStatus)}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${BITRIX_STATUS_COLORS[client.bitrixStatus] || ''}`}>
                    {getBitrixLabel(client.bitrixStatus)}
                  </span>
                </div>

                {/* Info grid */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                  {client.direction && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Briefcase className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">{client.direction}</span>
                    </div>
                  )}
                  {client.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">{client.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span>{client.branchCount} {t('branch')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span>{client.employeeCount} {t('employees')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calculator className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="font-medium text-emerald-400">{formatSum(calculateTariff(client.employeeCount))}</span>
                  </div>
                  {client.referredFrom && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Megaphone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">{client.referredFrom}</span>
                    </div>
                  )}
                </div>

                {client.note && (
                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 border-t border-slate-800/60 pt-2">
                    {client.note}
                  </p>
                )}

                {/* Footer: created by + date */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  {client.createdBy && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User2 className="w-3 h-3" />
                      <span>{client.createdBy.fullName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <span>{formatDateTime(client.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 max-w-sm w-full mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t('confirm_delete')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('confirm_delete_client')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                {t('cancel')}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editClient && (
        <EditClientModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSave={(data) => updateMutation.mutate({ id: editClient.id, data })}
          isPending={updateMutation.isPending}
        />
      )}
    </AppLayout>
  );
}

function EditClientModal({ client, onClose, onSave, isPending }: {
  client: Client;
  onClose: () => void;
  onSave: (data: Partial<Client>) => void;
  isPending: boolean;
}) {
  const { t } = useI18n();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const [form, setForm] = useState({
    fullName: client.fullName,
    phone: client.phone,
    direction: client.direction || '',
    position: client.position || '',
    location: client.location || '',
    branchCount: client.branchCount,
    employeeCount: client.employeeCount,
    referredFrom: client.referredFrom || '',
    note: client.note || '',
    productId: client.productId || '',
    installationStatus: client.installationStatus || 'NEW',
    bitrixStatus: client.bitrixStatus || 'NOT_ADDED',
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const tariff = calculateTariff(form.employeeCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-lg w-full mx-4 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">{t('edit_client')}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t('client_name')} *</label>
              <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_phone')} *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_direction')}</label>
              <input value={form.direction} onChange={e => set('direction', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_position')}</label>
              <input value={form.position} onChange={e => set('position', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_branches')}</label>
              <input type="number" min={1} value={form.branchCount} onChange={e => set('branchCount', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_employees')}</label>
              <input type="number" min={0} value={form.employeeCount} onChange={e => set('employeeCount', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>

            {/* Tariff display */}
            <div className="col-span-2">
              <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  {t('client_tariff')}
                </span>
                <span className="text-sm font-bold text-emerald-400">{formatSum(tariff)}</span>
              </div>
            </div>

            {/* Product */}
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t('client_product')}</label>
              <select
                value={form.productId}
                onChange={e => set('productId', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t('select_product')}</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Installation Status */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_installation_status')}</label>
              <select
                value={form.installationStatus}
                onChange={e => set('installationStatus', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NEW">{t('installation_new')}</option>
                <option value="IN_PROGRESS">{t('installation_in_progress')}</option>
                <option value="INSTALLED">{t('installation_installed')}</option>
              </select>
            </div>

            {/* Bitrix Status */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">{t('client_bitrix_status')}</label>
              <select
                value={form.bitrixStatus}
                onChange={e => set('bitrixStatus', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NOT_ADDED">{t('bitrix_not_added')}</option>
                <option value="ADDED">{t('bitrix_added')}</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t('client_location')}</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t('client_referred_from')}</label>
              <input value={form.referredFrom} onChange={e => set('referredFrom', e.target.value)} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">{t('note')}</label>
              <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">{t('cancel')}</button>
            <button
              onClick={() => onSave({
                ...form,
                productId: form.productId || undefined,
                direction: form.direction || undefined,
                position: form.position || undefined,
                location: form.location || undefined,
                referredFrom: form.referredFrom || undefined,
                note: form.note || undefined,
              } as any)}
              disabled={isPending}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />{t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
