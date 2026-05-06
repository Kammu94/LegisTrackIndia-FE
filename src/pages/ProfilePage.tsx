import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, Calendar, LayoutDashboard, LogOut, Mail, Phone, Scale, User } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../api/apiSlice';
import type { RootState } from '../store/store';
import { logout, updateUser } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import MobileNav from '../components/MobileNav';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  gender: z.string().trim().min(1, 'Gender is required'),
  barCouncilId: z.string().trim().min(1, 'Bar Council ID is required'),
  phoneNumber: z.string().trim().min(5, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: profile, isLoading, isError } = useGetProfileQuery();
  const [updateProfileRequest, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: '',
      barCouncilId: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (!profile) return;

    reset({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      gender: profile.gender ?? '',
      barCouncilId: profile.barCouncilId ?? '',
      phoneNumber: profile.phoneNumber ?? '',
    });
  }, [profile, reset]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const updatedProfile = await updateProfileRequest(values).unwrap();
      dispatch(updateUser(updatedProfile));
      setSuccessMessage('Profile updated successfully.');
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } } | null | undefined)?.data?.message;
      alert(message || 'Failed to update profile');
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex max-w-full overflow-x-hidden">
      <div className="w-64 bg-legal-dark text-white hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <Scale className="h-8 w-8 text-legal-gold" />
          <span className="text-xl font-bold tracking-tight">LegisTrack</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/dashboard" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link to="/cases" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Briefcase className="h-5 w-5" />
            <span>My Cases</span>
          </Link>
          <Link to="/hearings" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Calendar className="h-5 w-5" />
            <span>Hearings</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
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
            <MobileNav onLogout={handleLogout} />
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">Profile Settings</h1>
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
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="text-center sm:text-left mb-8">
                <h2 className="text-2xl font-bold text-legal-corporate">Manage Your Profile</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Keep your professional details up to date for your LegisTrack account.
                </p>
              </div>

              {isError && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  Failed to load profile details.
                </div>
              )}

              {successMessage && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('firstName')}
                        type="text"
                        className="block w-full pl-10 border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                        placeholder="First name"
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('lastName')}
                        type="text"
                        className="block w-full pl-10 border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                        placeholder="Last name"
                      />
                    </div>
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      {...register('gender')}
                      className="mt-1 block w-full border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
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
                        className="block w-full pl-10 border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                        placeholder="Bar Council ID"
                      />
                    </div>
                    {errors.barCouncilId && <p className="mt-1 text-xs text-red-600">{errors.barCouncilId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('phoneNumber')}
                        type="tel"
                        className="block w-full pl-10 border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                        placeholder="Phone number"
                      />
                    </div>
                    {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        disabled
                        value={profile?.email ?? user?.email ?? ''}
                        className="block w-full pl-10 border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-center sm:justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-legal-corporate text-white font-semibold shadow-md hover:bg-legal-dark transition-colors disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
