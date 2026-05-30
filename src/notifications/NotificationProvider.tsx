import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { ConfirmInput, NotificationItem, NotifyInput, NotifySeverity, PromptInput } from './types';
import { setConfirmRef, setNotifyRef, setPlanGateRef, setPromptRef } from './notifyService';
import { GavelIcon, ScalesIcon, ShieldIcon } from './icons';
import { useGetSubscriptionPlansQuery } from '../api/apiSlice';

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

type BillingFrequency = 'weekly' | 'monthly' | 'yearly';

type Plan = {
  id: 'weekly-sprint' | 'professional-desk' | 'enterprise-firm';
  name: string;
  highlight?: boolean;
  canonical: { price: number; frequency: BillingFrequency };
  features: string[];
};

const frequencies: Array<{ key: BillingFrequency; label: string; unit: string }> = [
  { key: 'weekly', label: 'Weekly', unit: 'week' },
  { key: 'monthly', label: 'Monthly', unit: 'month' },
  { key: 'yearly', label: 'Yearly', unit: 'year' },
];

const planForFrequency: Record<BillingFrequency, Plan['id']> = {
  weekly: 'weekly-sprint',
  monthly: 'professional-desk',
  yearly: 'enterprise-firm',
};

const frequencyForPlan: Record<Plan['id'], BillingFrequency> = {
  'weekly-sprint': 'weekly',
  'professional-desk': 'monthly',
  'enterprise-firm': 'yearly',
};

const formatINR = (value: number, decimals: 0 | 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);

const taxRate = 0.18;

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
  const [planGateOpen, setPlanGateOpen] = useState(false);
  const { data: subscriptionPlans } = useGetSubscriptionPlansQuery();
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('billingFrequency') : null;
    if (stored === 'weekly' || stored === 'monthly' || stored === 'yearly') return stored;
    return 'monthly';
  });
  const [selectedPlanId, setSelectedPlanId] = useState<Plan['id']>('professional-desk');
  const timers = useRef<Record<string, number>>({});
  const dialogResolveRef = useRef<((value: boolean | string | null) => void) | null>(null);
  const activeDialogKindRef = useRef<DialogState['kind'] | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const promptInputRef = useRef<HTMLInputElement | null>(null);

  const plans: Plan[] = useMemo(() => {
    const defaults: Plan[] = [
      {
        id: 'weekly-sprint',
        name: 'Weekly Sprint',
        canonical: { price: 99, frequency: 'weekly' },
        features: [
          '100 Cases Registration',
          '100 Transactional Emails & SMS Messages',
          'Daily grouped hearings dashboard',
          'Standard support',
        ],
      },
      {
        id: 'professional-desk',
        name: 'Professional Desk',
        highlight: true,
        canonical: { price: 199, frequency: 'monthly' },
        features: [
          '1,000 Cases Registration/mo',
          '1,000 Automated Emails & Messages/mo',
          'Priority background NJDG (eCourts) syncing',
          'Advanced year/month filters',
          'Priority support',
        ],
      },
      {
        id: 'enterprise-firm',
        name: 'Enterprise Firm',
        canonical: { price: 1999, frequency: 'yearly' },
        features: [
          'Unlimited Case Registrations',
          'Unlimited Transactional Emails & Messages',
          'Top-priority nightly eCourts processing queues',
          'Custom communication API routing',
          '24/7 dedicated account manager',
        ],
      },
    ];

    if (!subscriptionPlans || subscriptionPlans.length === 0) {
      return defaults;
    }

    const byId = new Map(subscriptionPlans.map((p) => [p.id, p]));
    return defaults.map((plan) => {
      const row = byId.get(plan.id);
      if (!row) return plan;
      return {
        ...plan,
        name: row.planType?.trim() || plan.name,
        canonical: { ...plan.canonical, price: row.amountInr },
      };
    });
  }, [subscriptionPlans]);

  const activeFrequencyMeta = useMemo(
    () => frequencies.find((f) => f.key === billingFrequency) ?? frequencies[1],
    [billingFrequency]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1],
    [plans, selectedPlanId]
  );

  const pricingForPlan = useCallback(
    (plan: Plan) => {
      return plan.canonical.price;
    },
    [billingFrequency]
  );

  const subtotal = useMemo(() => pricingForPlan(selectedPlan), [pricingForPlan, selectedPlan]);
  const gst = useMemo(() => subtotal * taxRate, [subtotal]);
  const total = useMemo(() => subtotal + gst, [subtotal, gst]);

  const closePlanGate = useCallback(() => {
    setPlanGateOpen(false);
  }, []);

  const goToPricing = useCallback((planId?: Plan['id'], frequency?: BillingFrequency) => {
    if (typeof window !== 'undefined') {
      if (frequency) {
        window.localStorage.setItem('billingFrequency', frequency);
      }

      if (planId) {
        window.localStorage.setItem('selectedSubscriptionPlanId', planId);
      }

      const query = planId ? `?planId=${encodeURIComponent(planId)}` : '';
      window.location.assign(`/subscription${query}`);
    }
  }, []);

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
        current.forEach((existing) => {
          const timer = timers.current[existing.id];
          if (timer) {
            window.clearTimeout(timer);
            delete timers.current[existing.id];
          }
        });

        return [item];
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

  const proceedToSecureCheckout = useCallback(() => {
    notify({
      severity: 'info',
      title: 'Secure Checkout',
      message: `${selectedPlan.name} • ${activeFrequencyMeta.label} billing • Total ${formatINR(total, 2)}`,
    });
    goToPricing(selectedPlanId, billingFrequency);
  }, [activeFrequencyMeta.label, billingFrequency, goToPricing, notify, selectedPlan.name, selectedPlanId, total]);

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
    setPlanGateRef(() => {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('billingFrequency') : null;
      const nextFrequency =
        stored === 'weekly' || stored === 'monthly' || stored === 'yearly' ? stored : 'monthly';
      setBillingFrequency(nextFrequency);
      setSelectedPlanId(planForFrequency[nextFrequency]);
      setPlanGateOpen(true);
    });
    return () => {
      setNotifyRef(null);
      setConfirmRef(null);
      setPromptRef(null);
      setPlanGateRef(null);
    };
  }, [notify, confirm, prompt]);

  useEffect(() => {
    if (!planGateOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [planGateOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('billingFrequency', billingFrequency);
  }, [billingFrequency]);

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
      {planGateOpen && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/50 p-4 lg:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Secure Plan Validation"
            className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="p-6 sm:p-8">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-legal-corporate">Secure Plan Validation</p>
                <p className="mt-3 text-sm sm:text-base text-gray-700 max-w-3xl mx-auto">
                  Your free trial limits have been reached. Select a baseline plan below to preserve your existing case
                  data and resume full services.
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <div
                  className="inline-flex rounded-2xl bg-gray-50 p-1 ring-1 ring-gray-200"
                  role="tablist"
                  aria-label="Billing frequency"
                >
                  {frequencies.map((f) => {
                    const active = f.key === billingFrequency;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                          active ? 'bg-[#003366] text-white' : 'text-gray-700 hover:bg-white'
                        }`}
                        onClick={() => {
                          setBillingFrequency(f.key);
                          setSelectedPlanId(planForFrequency[f.key]);
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
                  {plans.map((plan) => {
                    const selected = plan.id === selectedPlanId;
                    const highlight = plan.highlight === true;
                    const price = pricingForPlan(plan);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        className={`text-left rounded-3xl border bg-white p-5 transition-all ${
                          selected
                            ? 'border-legal-gold shadow-md'
                            : highlight
                              ? 'border-legal-gold/50'
                              : 'border-gray-100 hover:border-gray-200'
                        }`}
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setBillingFrequency(frequencyForPlan[plan.id]);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-legal-corporate">{plan.name}</p>
                            <p className="mt-3 text-2xl font-extrabold text-legal-corporate">
                              {formatINR(price, 0)}
                              <span className="ml-1 text-sm font-semibold text-gray-600">
                                / {frequencies.find((f) => f.key === plan.canonical.frequency)?.unit ?? plan.canonical.frequency}
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">Excluding GST</p>
                          </div>
                          {highlight && (
                            <span className="rounded-full bg-legal-gold px-3 py-1 text-xs font-bold text-legal-dark">
                              Most Popular
                            </span>
                          )}
                        </div>

                        <ul className="mt-4 space-y-2">
                          {plan.features.map((feature) => (
                            <li key={feature} className="text-xs text-gray-700">
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-3xl bg-white p-6 ring-1 ring-gray-100">
                  <p className="text-sm font-bold text-legal-corporate">Cost Breakdown</p>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-gray-700">Subtotal</p>
                      <p className="text-sm font-bold text-legal-corporate">{formatINR(subtotal, 2)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-gray-700">GST (18%)</p>
                      <p className="text-sm font-bold text-legal-corporate">{formatINR(gst, 2)}</p>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-base font-extrabold text-legal-corporate">Total</p>
                      <p className="text-base font-extrabold text-legal-corporate">{formatINR(total, 2)}</p>
                    </div>
                  </div>

                  <p className="mt-5 text-xs text-gray-500">
                    All listed prices are exclusive of GST (18%). Standard statutory taxes will be applied at secure
                    checkout.
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      className="w-full rounded-2xl bg-[#003366] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
                      onClick={proceedToSecureCheckout}
                    >
                      Proceed to Secure Checkout
                    </button>
                    <button
                      type="button"
                      className="w-full text-sm font-semibold text-gray-600 hover:underline"
                      onClick={() => {
                        closePlanGate();
                        goToPricing(selectedPlanId, billingFrequency);
                      }}
                    >
                      Return to Plans
                    </button>
                  </div>
                </div>
              </div>
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
