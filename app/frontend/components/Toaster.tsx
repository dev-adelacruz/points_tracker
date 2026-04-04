import React, { useEffect, useState } from 'react';
import { useToast, type Toast } from '../context/ToastContext';

const AUTO_DISMISS_MS = 4000;

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);
  const [undoExpired, setUndoExpired] = useState(false);

  // Animate in
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(t);
  }, []);

  // Track undo expiry
  useEffect(() => {
    if (!toast.undoDeadline) return;
    const remaining = toast.undoDeadline - Date.now();
    if (remaining <= 0) { setUndoExpired(true); return; }
    const t = setTimeout(() => setUndoExpired(true), remaining);
    return () => clearTimeout(t);
  }, [toast.undoDeadline]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 200);
  };

  const handleUndo = () => {
    toast.onUndo?.();
    handleDismiss();
  };

  const isSuccess = toast.variant === 'success';

  return (
    <div
      className={`flex items-start gap-3 w-full max-w-sm rounded-xl shadow-lg ring-1 px-4 py-3 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        isSuccess
          ? 'bg-white ring-emerald-100'
          : 'bg-white ring-red-100'
      }`}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
          isSuccess ? 'bg-emerald-100' : 'bg-red-100'
        }`}
      >
        {isSuccess ? (
          <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      {/* Message + undo */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 leading-relaxed">{toast.message}</p>
        {toast.onUndo && !undoExpired && (
          <button
            onClick={handleUndo}
            className="mt-1 text-xs font-semibold text-teal-600 hover:text-teal-800 transition-colors"
          >
            {toast.undoLabel ?? 'Undo'}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

const Toaster: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
};

export default Toaster;
