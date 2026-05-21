import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { useCreateRazorpayOrderMutation } from '../api/apiSlice';
import { useNotify } from '../notifications/NotificationProvider';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  subscriptionPlanId: string;
  planName: string;
  onAfterOpen?: () => void;
};

const checkoutScriptUrl = 'https://checkout.razorpay.com/v1/checkout.js';

const RazorpayCheckoutButton = ({ subscriptionPlanId, planName, onAfterOpen }: Props) => {
  const notify = useNotify();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [createOrder, { isLoading }] = useCreateRazorpayOrderMutation();
  const [scriptReady, setScriptReady] = useState(false);

  const prefillEmail = useMemo(() => (user?.email ?? '').trim(), [user?.email]);
  const prefillName = useMemo(() => (user?.fullName ?? '').trim(), [user?.fullName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.Razorpay) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${checkoutScriptUrl}"]`);
    if (existing) {
      const onLoad = () => setScriptReady(true);
      const onError = () => setScriptReady(false);
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    const script = document.createElement('script');
    script.src = checkoutScriptUrl;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setScriptReady(false);
    document.body.appendChild(script);
  }, []);

  const startCheckout = async () => {
    if (!scriptReady || !window.Razorpay) {
      notify({
        severity: 'error',
        title: 'Checkout Unavailable',
        message: 'Razorpay checkout failed to load. Please try again.',
      });
      return;
    }

    try {
      const order = await createOrder({ subscriptionPlanId }).unwrap();

      const options: Record<string, unknown> = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'LegisIndia',
        description: planName,
        order_id: order.orderId,
        prefill: {
          name: prefillName,
          email: prefillEmail,
        },
        method: {
          upi: true,
        },
        handler: () => {
          notify({
            severity: 'info',
            title: 'Payment Processing',
            message: 'Payment authorized. Confirming your subscription…',
          });
          navigate('/dashboard');
        },
        modal: {
          ondismiss: () => {
            notify({
              severity: 'warning',
              title: 'Checkout Closed',
              message: 'Payment was not completed.',
            });
          },
        },
        theme: {
          color: '#003366',
        },
      };

      const rzp = new window.Razorpay(options);
      onAfterOpen?.();
      rzp.open();
    } catch {
      notify({
        severity: 'error',
        title: 'Checkout Failed',
        message: 'Unable to start checkout. Please try again.',
      });
    }
  };

  return (
    <button
      type="button"
      className="w-full rounded-2xl bg-[#003366] px-5 py-3 text-sm font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={startCheckout}
      disabled={isLoading}
    >
      {isLoading ? 'Starting Checkout…' : 'Proceed to Secure Checkout'}
    </button>
  );
};

export default RazorpayCheckoutButton;

