'use client';

import { useState, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Product } from '@/types';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft, AlertCircle, Phone, ImagePlus, X, Upload } from 'lucide-react';
import Link from 'next/link';

function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NewImprovementPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    productId: '',
    clientPhone: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form & { images: string[] }) => api.post('/improvements', {
      ...data,
      requestedByClientsCount: 1,
      productId: data.productId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['improvements'] });
      router.push('/improvements');
    },
    onError: (err: any) => setError(err.response?.data?.message || t('no_data')),
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    if (images.length + imageFiles.length > 5) {
      setError("Maksimum 5 ta rasm qo'shish mumkin");
      return;
    }
    setIsCompressing(true);
    try {
      const compressed = await Promise.all(imageFiles.map(f => compressImage(f)));
      setImages(prev => [...prev, ...compressed]);
      setError('');
    } catch {
      setError('Rasmni yuklashda xatolik');
    }
    setIsCompressing(false);
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AppLayout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/improvements" className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('new_improvement_title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('new_improvement_subtitle')}</p>
          </div>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate({ ...form, images }); }}
          className="glass-card p-6 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('improvement_title')} <span className="text-red-400">*</span>
            </label>
            <input
              id="improvement-title"
              type="text"
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder={t('improvement_title_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('product')}
            </label>
            <select
              id="improvement-product"
              value={form.productId}
              onChange={e => set('productId', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">{t('select_product')}</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Client Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              {t('client_phone')}
              <span className="text-[10px] text-slate-600 font-normal">(ixtiyoriy)</span>
            </label>
            <input
              id="improvement-phone"
              type="tel"
              value={form.clientPhone}
              onChange={e => set('clientPhone', e.target.value)}
              placeholder="+998 90 000 00 00"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {t('description')} <span className="text-red-400">*</span>
            </label>
            <textarea
              id="improvement-description"
              required
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={5}
              placeholder={t('improvement_description_placeholder')}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5 text-slate-500" />
              Rasmlar
              <span className="text-[10px] text-slate-600 font-normal">(ixtiyoriy, maks. 5 ta)</span>
            </label>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
              }`}
            >
              {isCompressing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Rasmlar siqilmoqda...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={`w-8 h-8 ${isDragOver ? 'text-indigo-400' : 'text-slate-600'}`} />
                  <p className="text-xs text-slate-400">
                    Rasmlarni bu yerga tashlang yoki <span className="text-indigo-400 font-medium">tanlang</span>
                  </p>
                  <p className="text-[10px] text-slate-600">PNG, JPG, WEBP — max 5 ta</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-700 aspect-video bg-slate-800">
                    <img src={img} alt={`Rasm ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Link
              href="/improvements"
              className="flex-1 py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('submitting')}</>
              ) : t('submit_request')}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
