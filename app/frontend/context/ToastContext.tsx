import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastVariant = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  undoLabel?: string;
  onUndo?: () => void;
  undoDeadline?: number; // epoch ms when undo expires
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (opts: {
    message: string;
    variant: ToastVariant;
    duration?: number;
    undoLabel?: string;
    onUndo?: () => void;
    undoDuration?: number;
  }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    ({
      message,
      variant,
      duration = 4000,
      undoLabel,
      onUndo,
      undoDuration = 5000,
    }: {
      message: string;
      variant: ToastVariant;
      duration?: number;
      undoLabel?: string;
      onUndo?: () => void;
      undoDuration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = {
        id,
        message,
        variant,
        ...(onUndo
          ? {
              undoLabel: undoLabel ?? 'Undo',
              onUndo,
              undoDeadline: Date.now() + undoDuration,
            }
          : {}),
      };
      setToasts((prev) => [...prev, toast]);
      timers.current[id] = setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
