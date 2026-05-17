import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import { Scale, LogOut, LayoutDashboard, Briefcase, Calendar, Inbox, User, CreditCard } from 'lucide-react';
import MobileNav from '../components/MobileNav';
import { useGetProfileQuery, type SubscriptionState } from '../api/apiSlice';
import { useNotify } from '../notifications/NotificationProvider';

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

const addMonths = (date: Date, months: number) => {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const addYears = (date: Date, years: number) => {
  const copy = new Date(date.getTime());
  copy.setFullYear(copy.getFullYear() + years);
  return copy;
};

const parseUtc = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getPaidPlanFromState = (state?: SubscriptionState | null) => {
  const planTypeLower = (state?.planType ?? 'Free').toLowerCase();

  if (state?.premiumOverride === true) {
    const start = parseUtc(state.premiumOverrideAtUtc) ?? parseUtc(state.createdAtUtc) ?? new Date();
    const end = addYears(start, 1);
    return {
      planName: 'Enterprise Firm',
      frequency: 'yearly' as const,
      start,
      end,
      isOverride: true,
    };
  }

  if (planTypeLower === 'free') return null;

  const start = parseUtc(state?.createdAtUtc) ?? new Date();
  if (planTypeLower.includes('week')) {
    return {
      planName: state?.planType ?? 'Weekly Sprint',
      frequency: 'weekly' as const,
      start,
      end: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000),
    };
  }
  if (planTypeLower.includes('month') || planTypeLower.includes('professional')) {
    return { planName: state?.planType ?? 'Professional Desk', frequency: 'monthly' as const, start, end: addMonths(start, 1) };
  }
  if (planTypeLower.includes('year') || planTypeLower.includes('enterprise')) {
    return { planName: state?.planType ?? 'Enterprise Firm', frequency: 'yearly' as const, start, end: addYears(start, 1) };
  }

  return { planName: state?.planType ?? 'Subscription', frequency: 'monthly' as const, start, end: addMonths(start, 1) };
};

const PricingPage = () => {
  const notify = useNotify();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: profileData } = useGetProfileQuery();

  const subscriptionState = profileData?.subscriptionState ?? user?.subscriptionState ?? null;
  const paidPlan = getPaidPlanFromState(subscriptionState);
  const isPaidUser = paidPlan !== null;

  const [frequency, setFrequency] = useState<BillingFrequency>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('billingFrequency') : null;
    if (stored === 'weekly' || stored === 'monthly' || stored === 'yearly') return stored;
    return 'monthly';
  });
  const [selectedPlanId, setSelectedPlanId] = useState<Plan['id'] | null>(null);
  const [showPlans, setShowPlans] = useState(() => !isPaidUser);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('billingFrequency', frequency);
  }, [frequency]);

  useEffect(() => {
    setShowPlans(!isPaidUser);
  }, [isPaidUser]);

  const plans: Plan[] = useMemo(
    () => [
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
    ],
    []
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const activeFrequencyMeta = frequencies.find((f) => f.key === frequency) ?? frequencies[1];

  const pricingForPlan = (plan: Plan) => {
    return plan.canonical.price;
  };

  const openModal = (planId: Plan['id']) => {
    setFrequency(frequencyForPlan[planId]);
    setSelectedPlanId(planId);
  };
  const closeModal = () => setSelectedPlanId(null);

  const subtotal = selectedPlan ? pricingForPlan(selectedPlan) : 0;
  const gst = subtotal * taxRate;
  const total = subtotal + gst;

  const proceed = () => {
    if (!selectedPlan) return;
    const title = 'Secure Checkout';
    const message = `${selectedPlan.name} • ${activeFrequencyMeta.label} billing • Total ${formatINR(total, 2)}`;
    notify({ severity: 'info', title, message });
    closeModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex max-w-full overflow-x-hidden">
      <div className="w-64 bg-legal-dark text-white hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <Scale className="h-8 w-8 text-legal-gold" />
          <span className="text-xl font-bold tracking-tight">LegisTrack</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/cases"
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Briefcase className="h-5 w-5" />
            <span>My Cases</span>
          </Link>
          <Link
            to="/hearings"
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Calendar className="h-5 w-5" />
            <span>Hearings</span>
          </Link>
          <Link
            to="/leads"
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Inbox className="h-5 w-5" />
            <span>Leads</span>
          </Link>
          <Link
            to="/subscription"
            className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white"
          >
            <CreditCard className="h-5 w-5" />
            <span>Subscription</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              dispatch(logout());
              navigate('/login');
            }}
            className="flex items-center space-x-3 p-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm min-h-16 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <MobileNav
              onLogout={() => {
                dispatch(logout());
                navigate('/login');
              }}
            />
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">Subscription</h1>
          </div>
          <div className="flex items-center gap-3 min-w-0 max-w-full">
            <div className="text-right min-w-0">
              <p className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</p>
              <p className="text-xs text-gray-500">Professional Account</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-legal-gold flex items-center justify-center text-legal-dark font-bold shrink-0">
              {getUserInitial(user)}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 w-full max-w-full">
          <div className="mx-auto w-full max-w-6xl">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-extrabold text-legal-corporate">Plans & Pricing</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                Choose a flexible operational baseline for your independent practice or legal firm.
              </p>
            </div>

            {isPaidUser && paidPlan && (
              <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-600">Current Plan</p>
                    <p className="mt-1 text-xl font-extrabold text-legal-corporate break-words">{paidPlan.planName}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Billing cycle: {paidPlan.start.toLocaleDateString()} → {paidPlan.end.toLocaleDateString()}
                    </p>
                    {paidPlan.isOverride && (
                      <p className="mt-1 text-xs text-gray-500">Premium override enabled (no payment required).</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-legal-corporate hover:bg-gray-50"
                    onClick={() => setShowPlans(true)}
                  >
                    See Plans
                  </button>
                </div>

                <div className="mt-5 rounded-2xl bg-gray-50 p-5 ring-1 ring-gray-100">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-700">Status</p>
                    <p className="text-sm font-extrabold text-[#004D26]">Active</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-700">Cycle type</p>
                    <p className="text-sm font-bold text-legal-corporate capitalize">{paidPlan.frequency}</p>
                  </div>
                </div>
              </div>
            )}

            {showPlans && (
              <div className="mt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mt-2 flex justify-center">
                    <div
                      className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-gray-200"
                      role="tablist"
                      aria-label="Billing frequency"
                    >
                      {frequencies.map((f) => {
                        const active = f.key === frequency;
                        return (
                          <button
                            key={f.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                              active ? 'bg-[#003366] text-white' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setFrequency(f.key);
                            }}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const price = pricingForPlan(plan);
                    const unit =
                      frequencies.find((f) => f.key === plan.canonical.frequency)?.unit ?? plan.canonical.frequency;
                    const highlight = plan.highlight === true;
                    const isActive = plan.id === planForFrequency[frequency];
                    return (
                      <div
                        key={plan.id}
                        className={`relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 ${
                          highlight || isActive ? 'ring-legal-gold/70 shadow-md' : 'ring-gray-100'
                        }`}
                      >
                        {highlight && (
                          <div className="absolute right-4 top-4 rounded-full bg-legal-gold px-3 py-1 text-xs font-bold text-legal-dark">
                            Most Popular
                          </div>
                        )}

                        <h2 className="text-lg font-bold text-legal-corporate">{plan.name}</h2>
                        <div className="mt-5 flex items-end gap-2">
                          <p className="text-3xl font-extrabold text-legal-corporate">{formatINR(price, 0)}</p>
                          <p className="pb-1 text-sm text-gray-600">/ {unit}</p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Excluding GST</p>

                        <ul className="mt-6 space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className="mt-1 h-2 w-2 rounded-full bg-legal-gold shrink-0" />
                              <span className="min-w-0 break-words">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          className={`mt-8 w-full rounded-2xl px-5 py-3 text-sm font-bold text-white transition-opacity ${
                            highlight ? 'bg-[#004D26]' : 'bg-[#003366]'
                          } hover:opacity-95`}
                          onClick={() => openModal(plan.id)}
                        >
                          Select Plan
                        </button>

                        <p className="mt-3 text-center text-xs text-gray-500">
                          Secure checkout calculates GST and final totals.
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 text-center text-sm text-gray-600">
                  All listed prices are exclusive of GST (18%). Standard statutory taxes will be applied at secure checkout.
                </div>

                {isPaidUser && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      className="text-sm font-semibold text-legal-corporate hover:underline"
                      onClick={() => setShowPlans(false)}
                    >
                      Hide Plans
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 lg:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Secure Plan Validation"
            className="w-full max-w-lg rounded-3xl bg-white shadow-xl ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-4 p-6">
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-legal-corporate">Secure Plan Validation</p>
                <p className="mt-1 text-sm text-gray-600 break-words">
                  Reviewing {selectedPlan.name} with {activeFrequencyMeta.label} billing.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6">
              <div className="flex justify-center">
                <div
                  className="inline-flex rounded-2xl bg-gray-50 p-1 ring-1 ring-gray-200"
                  role="tablist"
                  aria-label="Modal billing frequency"
                >
                  {frequencies.map((f) => {
                    const active = f.key === frequency;
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
                          setFrequency(f.key);
                          setSelectedPlanId(planForFrequency[f.key]);
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-white ring-1 ring-gray-100">
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-700">Subtotal</p>
                    <p className="text-sm font-bold text-legal-corporate">{formatINR(subtotal, 2)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-gray-700">GST (18%)</p>
                    <p className="text-sm font-bold text-legal-corporate">{formatINR(gst, 2)}</p>
                  </div>
                  <div className="mt-4 h-px bg-gray-100" />
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-base font-extrabold text-legal-corporate">Total</p>
                    <p className="text-base font-extrabold text-legal-corporate">{formatINR(total, 2)}</p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                All listed prices are exclusive of GST (18%). Standard statutory taxes will be applied at secure checkout.
              </p>
            </div>

            <div className="flex flex-col gap-3 p-6 pt-5">
              <button
                type="button"
                className="w-full rounded-2xl bg-[#003366] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
                onClick={proceed}
              >
                Proceed to Secure Checkout
              </button>
              <button
                type="button"
                className="w-full text-sm font-semibold text-gray-600 hover:underline"
                onClick={closeModal}
              >
                Return to Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
