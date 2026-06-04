'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number; // ms, default 5000
}

export function UndoToast({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl px-4 py-3 min-w-[280px]">
        <div className="flex-1">
          <p className="text-sm text-slate-200 font-medium">{message}</p>
          {/* progress bar */}
          <div className="mt-1.5 h-0.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => { onUndo(); onDismiss(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          Bekor qilish
        </button>
        <button
          onClick={onDismiss}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
