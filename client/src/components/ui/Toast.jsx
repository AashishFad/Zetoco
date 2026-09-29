import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4000 }) => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast = { id, title, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const typeConfig = {
    success: { icon: CheckCircle2, border: 'border-emerald-500/40', text: 'text-emerald-400', bg: 'bg-emerald-950/40' },
    error: { icon: AlertCircle, border: 'border-rose-500/40', text: 'text-rose-400', bg: 'bg-rose-950/40' },
    warning: { icon: AlertTriangle, border: 'border-amber-500/40', text: 'text-amber-400', bg: 'bg-amber-950/40' },
    info: { icon: Info, border: 'border-brand-500/40', text: 'text-brand-400', bg: 'bg-brand-950/40' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Notification Viewport */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-slate-900 border ${config.border} shadow-elevated animate-slide-down`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.text}`} />
              <div className="flex-1 text-xs">
                {toast.title && <p className="font-bold text-white mb-0.5">{toast.title}</p>}
                <p className="text-slate-300 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                aria-label="Dismiss toast"
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
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (t) => console.log('Toast:', t),
    };
  }
  return context;
}
