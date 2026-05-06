import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useLoginMutation } from '../api/apiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { Scale, ShieldCheck, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login(data).unwrap();
      dispatch(setCredentials({ user: result, token: result.token }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } } | null | undefined)?.data?.message;
      alert(message || 'Login failed');
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
        <h2 className="text-3xl font-extrabold text-legal-corporate">LegisTrack</h2>
        <p className="mt-2 text-sm text-gray-600">Digital Case Diary & Ledger for Professionals</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                  placeholder="lawyer@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-legal-corporate hover:text-legal-gold transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-legal-corporate hover:bg-legal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to LegisTrack?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Create Professional Account
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center">
            <ShieldCheck className="h-3 w-3 mr-1" /> Secure & Encrypted Professional Environment
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
