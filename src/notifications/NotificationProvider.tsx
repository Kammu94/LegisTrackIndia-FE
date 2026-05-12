import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ConfirmInput, NotificationItem, NotifyInput, NotifySeverity, PromptInput } from './types';
import { setConfirmRef, setNotifyRef, setPromptRef } from './notifyService';
import { GavelIcon, ScalesIcon, ShieldIcon } from './icons';

type NotifyContextValue = {
  notify: (input: NotifyInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
  prompt: (input: PromptInput) => Promise<string | null>;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

const brand = {
  info: '#003366',
  success: '#004D26',
  warning: '#003366',
  error: '#990000',
  security: '#990000',
} as const satisfies Record<NotifySeverity, string>;

const iconForSeverity = (severity: NotifySeverity) => {
  if (severity === 'warning') return GavelIcon;
  if (severity === 'security') return ShieldIcon;
  if (severity === 'error') return GavelIcon;
  return ScalesIcon;
};

const isCritical = (severity: NotifySeverity) => severity === 'error' || severity === 'security';

const autoDismissMs = (severity: NotifySeverity) => {
  if (severity === 'info' || severity === 'success' || severity === 'warning') return 4000;
  return null;
};

type NotificationProviderProps = {
  children: ReactNode;
};

type DialogState =
  | {
      kind: 'confirm';
      title: string;
      message: string;
      confirmText: string;
      cancelText: string;
    }
  | {
      kind: 'prompt';
      title: string;
      message: string;
      confirmText: string;
      cancelText: string;
      placeholder?: string;
      value: string;
    };

const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const timers = useRef<Record<string, number>>({});
  const dialogResolveRef = useRef<((value: boolean | string | null) => void) | null>(null);
  const activeDialogKindRef = useRef<DialogState['kind'] | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    timers.current = {};
  }, []);

  const notify = useCallback(
    (input: NotifyInput) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const createdAt = Date.now();
      const persist = isCritical(input.severity) ? true : (input.persist ?? false);
      const item: NotificationItem = { ...input, id, createdAt, persist };

      setItems((current) => {
        const next = [item, ...current];
        return next.slice(0, 5);
      });

      if (!persist) {
        const timeout = autoDismissMs(input.severity);
        if (timeout) {
          timers.current[id] = window.setTimeout(() => dismiss(id), timeout);
        }
      }

      return id;
    },
    [dismiss]
  );

  const resolveActiveDialog = useCallback((value: boolean | string | null) => {
    const resolve = dialogResolveRef.current;
    dialogResolveRef.current = null;
    activeDialogKindRef.current = null;
    setDialog(null);
    resolve?.(value);
  }, []);

  const confirm = useCallback(
    (input: ConfirmInput) => {
      if (dialogResolveRef.current && activeDialogKindRef.current) {
        resolveActiveDialog(activeDialogKindRef.current === 'confirm' ? false : null);
      }

      return new Promise<boolean>((resolve) => {
        dialogResolveRef.current = resolve as (value: boolean | string | null) => void;
        activeDialogKindRef.current = 'confirm';
        setDialog({
          kind: 'confirm',
          title: input.title,
          message: input.message,
          confirmText: input.confirmText ?? 'Confirm',
          cancelText: input.cancelText ?? 'Cancel',
        });
      });
    },
    [resolveActiveDialog]
  );

  const prompt = useCallback(
    (input: PromptInput) => {
      if (dialogResolveRef.current && activeDialogKindRef.current) {
        resolveActiveDialog(activeDialogKindRef.current === 'confirm' ? false : null);
      }

      return new Promise<string | null>((resolve) => {
        dialogResolveRef.current = resolve as (value: boolean | string | null) => void;
        activeDialogKindRef.current = 'prompt';
        setDialog({
          kind: 'prompt',
          title: input.title,
          message: input.message,
          confirmText: input.confirmText ?? 'Submit',
          cancelText: input.cancelText ?? 'Cancel',
          placeholder: input.placeholder,
          value: input.defaultValue ?? '',
        });
      });
    },
    [resolveActiveDialog]
  );

  const cancelDialog = useCallback(() => {
    const kind = activeDialogKindRef.current;
    resolveActiveDialog(kind === 'confirm' ? false : null);
  }, [resolveActiveDialog]);

  const acceptDialog = useCallback(() => {
    if (!dialog) return;
    if (dialog.kind === 'confirm') {
      resolveActiveDialog(true);
      return;
    }
    resolveActiveDialog(dialog.value);
  }, [dialog, resolveActiveDialog]);

  useEffect(() => {
    setNotifyRef(notify);
    setConfirmRef(confirm);
    setPromptRef(prompt);
    return () => {
      setNotifyRef(null);
      setConfirmRef(null);
      setPromptRef(null);
    };
  }, [notify, confirm, prompt]);

  useEffect(() => {
    if (!dialog) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelDialog();
      if (event.key === 'Enter') acceptDialog();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, cancelDialog, acceptDialog]);

  useEffect(() => {
    if (!dialog) return;
    const frame = window.requestAnimationFrame(() => {
      if (dialog.kind === 'prompt') {
        promptInputRef.current?.focus();
        return;
      }
      confirmButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dialog]);

  const value = useMemo(
    () => ({ notify, dismiss, clear, confirm, prompt }),
    [notify, dismiss, clear, confirm, prompt]
  );

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <div
        className="fixed z-[80] flex w-[min(92vw,420px)] flex-col gap-3 lg:top-4 lg:right-4 lg:left-auto lg:bottom-auto bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 -translate-x-1/2 lg:translate-x-0"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((item) => (
          <Toast key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 lg:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={dialog.title}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl ring-1 ring-black/5 lg:translate-y-0"
          >
            <div className="flex items-start gap-3 p-5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${brand.info}14`, color: brand.info }}
              >
                <ScalesIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-legal-corporate break-words">{dialog.title}</p>
                <p className="mt-1 text-sm text-gray-600 break-words">{dialog.message}</p>
              </div>
            </div>

            {dialog.kind === 'prompt' && (
              <div className="px-5 pb-2">
                <input
                  ref={promptInputRef}
                  type="text"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-legal-corporate outline-none focus:border-[#003366] focus:ring-2 focus:ring-[#003366]/15"
                  placeholder={dialog.placeholder}
                  value={dialog.value}
                  onChange={(e) =>
                    setDialog((current) =>
                      current && current.kind === 'prompt'
                        ? { ...current, value: e.target.value }
                        : current
                    )
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 lg:pb-5">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={cancelDialog}
              >
                {dialog.cancelText}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                onClick={acceptDialog}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
};

type ToastProps = {
  item: NotificationItem;
  onDismiss: () => void;
};

const Toast = ({ item, onDismiss }: ToastProps) => {
  const [visible, setVisible] = useState(false);
  const Icon = iconForSeverity(item.severity);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role="status"
      className={`rounded-2xl border bg-white shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0 lg:translate-x-0' : 'opacity-0 translate-y-3 lg:translate-y-0 lg:translate-x-3'
      }`}
      style={{
        borderColor: `${brand[item.severity]}33`,
      }}
    >
      <div className="flex gap-3 p-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${brand[item.severity]}14`, color: brand[item.severity] }}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-legal-corporate break-words">{item.title}</p>
          <p className="mt-1 text-sm text-gray-600 break-words">{item.message}</p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify must be used within NotificationProvider');
  }
  return ctx.notify;
};

export const useConfirm = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within NotificationProvider');
  }
  return ctx.confirm;
};

export const usePrompt = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('usePrompt must be used within NotificationProvider');
  }
  return ctx.prompt;
};

export const useNotificationCenter = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotificationCenter must be used within NotificationProvider');
  }
  return ctx;
};

export default NotificationProvider;
