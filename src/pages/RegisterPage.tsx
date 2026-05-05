import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useRegisterMutation } from '../api/apiSlice';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../features/auth/authSlice';
import { Scale, Mail, Lock, User, Briefcase, MapPin } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  barCouncilId: z.string().min(2, 'Bar Council ID is required'),
  officeAddress: z.string().min(5, 'Office address is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });
  const [registerUser, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      const result = await registerUser(data).unwrap();
      dispatch(setCredentials({ user: result, token: result.token }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } } | null | undefined)?.data?.message;
      alert(message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-legal-dark p-3 rounded-xl shadow-lg">
            <Scale className="h-10 w-10 text-legal-gold" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-legal-corporate">Join LegisTrack</h2>
        <p className="mt-2 text-sm text-gray-600">Secure Digital Environment for Litigation Lawyers</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('fullName')}
                    type="text"
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                    placeholder="Advocate Name"
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
              </div>

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
                <label className="block text-sm font-medium text-gray-700">Bar Council ID</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('barCouncilId')}
                    type="text"
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                    placeholder="D/1234/2024"
                  />
                </div>
                {errors.barCouncilId && <p className="mt-1 text-xs text-red-600">{errors.barCouncilId.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Office Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    {...register('officeAddress')}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                    rows={2}
                    placeholder="Chamber No., Court Complex, City"
                  />
                </div>
                {errors.officeAddress && <p className="mt-1 text-xs text-red-600">{errors.officeAddress.message}</p>}
              </div>

              <div className="sm:col-span-2">
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
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-legal-corporate hover:bg-legal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-legal-gold disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </div>
          </form>

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
