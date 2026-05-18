import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRequestRegisterOtpMutation, useVerifyCompleteRegisterMutation } from '../api/apiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { Scale, Mail, Lock } from 'lucide-react';
import { useNotify } from '../notifications/NotificationProvider';

const RegisterPage = () => {
  const [requestOtp, { isLoading: isRequestingOtp }] = useRequestRegisterOtpMutation();
  const [verifyComplete, { isLoading: isVerifying }] = useVerifyCompleteRegisterMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotify();
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  const otpValue = useMemo(() => otpDigits.join(''), [otpDigits]);
  const canResend = formStep === 2 && resendSeconds <= 0;

  useEffect(() => {
    if (formStep !== 2) return;
    if (resendSeconds <= 0) return;

    const intervalId = window.setInterval(() => {
      setResendSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [formStep, resendSeconds]);

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      notify({ severity: 'warning', title: 'Missing Email', message: 'Please enter your email address.' });
      return;
    }

    try {
      await requestOtp({ email: trimmedEmail }).unwrap();
      notify({
        severity: 'success',
        title: 'Verification Sent',
        message: 'A 6-digit verification code has been sent to your email.',
      });
      setFormStep(2);
      setOtpDigits(['', '', '', '', '', '']);
      setPassword('');
      setConfirmPassword('');
      setResendSeconds(60);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err: unknown) {
      void err;
    }
  };

  const handleVerifyComplete = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedOtp = otpValue.trim();

    if (trimmedOtp.length !== 6) {
      notify({
        severity: 'warning',
        title: 'Invalid Code',
        message: 'Please enter the 6-digit verification code.',
      });
      return;
    }

    if (password.trim().length < 6) {
      notify({
        severity: 'warning',
        title: 'Weak Password',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      notify({
        severity: 'warning',
        title: 'Password Mismatch',
        message: 'Passwords do not match.',
      });
      return;
    }

    try {
      const result = await verifyComplete({
        email: trimmedEmail,
        otp: trimmedOtp,
        password,
      }).unwrap();
      dispatch(setCredentials({ user: result, token: result.token }));
      notify({
        severity: 'success',
        title: 'Account Created',
        message: 'Your account has been verified and created successfully.',
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      void err;
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (otpDigits[index]) return;
    if (index <= 0) return;
    otpRefs.current[index - 1]?.focus();
  };

  const handleResend = async () => {
    if (!canResend) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    try {
      await requestOtp({ email: trimmedEmail }).unwrap();
      notify({
        severity: 'success',
        title: 'Code Resent',
        message: 'A new verification code has been sent to your email.',
      });
      setOtpDigits(['', '', '', '', '', '']);
      setResendSeconds(60);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (err: unknown) {
      void err;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-legal-dark p-3 rounded-xl shadow-lg">
            <Scale className="h-10 w-10 text-legal-gold" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-legal-corporate">Join LegisTrack</h2>
        <p className="mt-2 text-sm text-gray-600">Secure Digital Environment for Litigation Lawyers</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl w-full">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {formStep === 1 ? (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                    placeholder="lawyer@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRequestingOtp}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-legal-corporate hover:bg-legal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold disabled:opacity-50 transition-all"
                >
                  {isRequestingOtp ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyComplete}>
              <div>
                <div className="text-sm font-medium text-gray-700">Verification Code</div>
                <div className="mt-2 flex gap-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(node) => {
                        otpRefs.current[index] = node;
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    {resendSeconds > 0 ? `Resend available in ${resendSeconds}s` : 'Didn’t receive the code?'}
                  </div>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || isRequestingOtp}
                    className="text-xs font-semibold text-legal-corporate disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Create Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type="password"
                      className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-legal-corporate hover:bg-legal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold disabled:opacity-50 transition-all"
                >
                  {isVerifying ? 'Creating Account...' : 'Verify & Create Account'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-legal-corporate hover:text-legal-gold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
