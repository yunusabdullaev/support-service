'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AppLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) return null;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Navbar />
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
