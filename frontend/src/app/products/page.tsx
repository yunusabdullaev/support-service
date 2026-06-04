'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product } from '@/types';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import { Package } from 'lucide-react';

export default function ProductsPage() {
  const { t } = useI18n();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  return (
    <AppLayout allowedRoles={['ADMIN', 'TEAM_LEADER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('products_title')}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} {t('products_title').toLowerCase()}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading ? (
            Array.from({length: 4}).map((_, i) => (
              <div key={i} className="glass-card p-5 h-32 animate-pulse">
                <div className="h-4 bg-slate-800 rounded mb-3 w-1/3" />
              </div>
            ))
          ) : products.map(product => (
            <div key={product.id} className="glass-card p-5 hover:border-slate-600 transition-all duration-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white">{product.name}</h3>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  </div>
                  {product.description && <p className="text-sm text-slate-400">{product.description}</p>}
                  <p className="text-xs text-slate-600 mt-2">{t('added')} {formatDate(product.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
