/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          let bgClass = 'bg-[#0E1424] text-white border-white/10';
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

          if (isSuccess) {
            bgClass = 'bg-[#12805C] text-white border-white/15';
            icon = <CheckCircle2 className="w-5 h-5 text-white shrink-0" />;
          } else if (isWarning) {
            bgClass = 'bg-[#B25E00] text-white border-white/15';
            icon = <AlertCircle className="w-5 h-5 text-white shrink-0" />;
          } else if (isError) {
            bgClass = 'bg-[#C0302F] text-white border-white/15';
            icon = <AlertCircle className="w-5 h-5 text-white shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border shadow-lg transition-all duration-200 transform translate-y-0 ${bgClass}`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-white/80 hover:text-white p-1 rounded transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
