import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useFieldArray } from 'react-hook-form';
import { Briefcase, Calendar, Inbox, LayoutDashboard, LogOut, Mail, MapPin, Phone, Plus, Scale, Trash2, User } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../api/apiSlice';
import type { RootState } from '../store/store';
import { logout, updateUser } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import MobileNav from '../components/MobileNav';

const whyClientConnectPointSchema = z.object({
  header: z.string().trim().min(1, 'Header is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).length <= 500,
      'Description must be under 500 words'
    ),
});

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  gender: z.string().trim().min(1, 'Gender is required'),
  barCouncilId: z.string().trim().min(1, 'Bar Council ID is required'),
  phoneNumber: z.string().trim().min(5, 'Phone number is required'),
  officeAddress: z.string().trim().min(1, 'Office address is required'),
  publicBio: z.string().trim().min(1, 'Public profile intro is required'),
  practiceAreas: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, 'Practice area is required')
          .regex(/^[A-Za-z\s]+$/, 'Practice area can contain only alphabets and spaces'),
      })
    )
    .min(1, 'At least 1 practice area is required')
    .max(5, 'Maximum 5 practice areas allowed'),
  whyClientConnectPoints: z
    .array(whyClientConnectPointSchema)
    .min(1, 'At least 1 point is required')
    .max(3, 'Maximum 3 points allowed'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: profile, isLoading, isError } = useGetProfileQuery();
  const [updateProfileRequest, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [successMessage, setSuccessMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const {
    control,
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
      officeAddress: '',
      publicBio: '',
      practiceAreas: [{ value: '' }],
      whyClientConnectPoints: [
        {
          header: 'Verified credibility',
          description: 'Public trust starts with visible credentials and a verified professional identity.',
        },
      ],
    },
  });

  const {
    fields: practiceAreaFields,
    append: appendPracticeArea,
    remove: removePracticeArea,
  } = useFieldArray({
    control,
    name: 'practiceAreas',
  });

  const {
    fields: whyClientFields,
    append: appendWhyClientPoint,
    remove: removeWhyClientPoint,
  } = useFieldArray({
    control,
    name: 'whyClientConnectPoints',
  });

  useEffect(() => {
    if (!profile) return;

    reset({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      gender: profile.gender ?? '',
      barCouncilId: profile.barCouncilId ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      officeAddress: profile.officeAddress ?? '',
      publicBio: profile.publicBio ?? '',
      practiceAreas:
        profile.practiceAreas && profile.practiceAreas.length > 0
          ? profile.practiceAreas.map((area) => ({ value: area }))
          : [{ value: '' }],
      whyClientConnectPoints:
        profile.whyClientConnectPoints && profile.whyClientConnectPoints.length > 0
          ? profile.whyClientConnectPoints
          : [
              {
                header: 'Verified credibility',
                description: 'Public trust starts with visible credentials and a verified professional identity.',
              },
            ],
    });
  }, [profile, reset]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const profileSlug = profile?.profileSlug ?? user?.profileSlug ?? '';
  const publicProfileUrl = profileSlug
    ? `${window.location.origin}/profile/${profileSlug}`
    : '';

  const handleCopyPublicUrl = async () => {
    if (!publicProfileUrl) return;

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopyMessage('Copied');
      window.setTimeout(() => setCopyMessage(''), 2000);
    } catch {
      setCopyMessage('Copy failed');
      window.setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const updatedProfile = await updateProfileRequest({
        ...values,
        practiceAreas: values.practiceAreas.map((area) => area.value.trim()),
      }).unwrap();
      dispatch(updateUser(updatedProfile));
      setSuccessMessage('Profile updated successfully.');
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } } | null | undefined)?.data?.message;
      alert(message || 'Failed to update profile');
    }
  };

  const practiceAreasError = errors.practiceAreas?.message;
  const whyClientConnectError = errors.whyClientConnectPoints?.message;
  const practiceAreaCount = useMemo(() => practiceAreaFields.length, [practiceAreaFields.length]);
  const whyClientCount = useMemo(() => whyClientFields.length, [whyClientFields.length]);

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
          <Link to="/leads" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <Inbox className="h-5 w-5" />
            <span>Leads</span>
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
                <div className="mb-4 flex max-w-full flex-col items-stretch gap-2 text-xs font-semibold text-legal-corporate sm:flex-row sm:flex-wrap sm:items-center">
                  <a
                    href={publicProfileUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 max-w-full items-center rounded-2xl border border-legal-gold/30 bg-legal-gold/10 px-4 py-2 hover:bg-legal-gold/20"
                    title={publicProfileUrl || 'Public profile URL not available'}
                  >
                    <span className="block min-w-0 break-all leading-5">
                      {publicProfileUrl || 'Public profile URL not available'}
                    </span>
                  </a>
                  {publicProfileUrl && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={handleCopyPublicUrl}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          void handleCopyPublicUrl();
                        }
                      }}
                      className="inline-flex w-fit cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-gray-600 transition-colors hover:border-legal-gold hover:text-legal-corporate"
                    >
                      {copyMessage || 'Copy'}
                    </span>
                  )}
                </div>
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Office Address</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('officeAddress')}
                        type="text"
                        className="block w-full pl-10 border-gray-300 rounded-lg focus:ring-legal-gold focus:border-legal-gold"
                        placeholder="Office address"
                      />
                    </div>
                    {errors.officeAddress && <p className="mt-1 text-xs text-red-600">{errors.officeAddress.message}</p>}
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

                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 sm:p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-legal-corporate">Public Profile Content</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Everything below appears on your public advocate profile page.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Public Intro</label>
                    <textarea
                      {...register('publicBio')}
                      rows={4}
                      className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-legal-gold focus:border-legal-gold"
                      placeholder="Write a short professional introduction for prospective clients."
                    />
                    {errors.publicBio && <p className="mt-1 text-xs text-red-600">{errors.publicBio.message}</p>}
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Areas of Practice</h4>
                        <p className="mt-1 text-xs text-gray-500">Add up to 5 practice areas using alphabets only.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => appendPracticeArea({ value: '' })}
                        disabled={practiceAreaCount >= 5}
                        className="inline-flex items-center gap-2 rounded-full border border-legal-gold/30 bg-legal-gold/10 px-3 py-2 text-xs font-semibold text-legal-corporate disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        Add Practice Area
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {practiceAreaFields.map((field, index) => (
                        <div key={field.id}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              {...register(`practiceAreas.${index}.value`)}
                              type="text"
                              className="block w-full rounded-lg border-gray-300 focus:ring-legal-gold focus:border-legal-gold"
                              placeholder={`Practice area ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removePracticeArea(index)}
                              disabled={practiceAreaCount <= 1}
                              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                          {errors.practiceAreas?.[index]?.value && (
                            <p className="mt-1 text-xs text-red-600">{errors.practiceAreas[index]?.value?.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {practiceAreasError && <p className="mt-2 text-xs text-red-600">{practiceAreasError}</p>}
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Why Clients Connect</h4>
                        <p className="mt-1 text-xs text-gray-500">
                          Keep 1 to 3 points. Each description must stay under 500 words.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          appendWhyClientPoint({
                            header: '',
                            description: '',
                          })
                        }
                        disabled={whyClientCount >= 3}
                        className="inline-flex items-center gap-2 rounded-full border border-legal-gold/30 bg-legal-gold/10 px-3 py-2 text-xs font-semibold text-legal-corporate disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Plus className="h-4 w-4" />
                        Add Point
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {whyClientFields.map((field, index) => (
                        <div key={field.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-800">Point {index + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeWhyClientPoint(index)}
                              disabled={whyClientCount <= 1}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Header</label>
                            <input
                              {...register(`whyClientConnectPoints.${index}.header`)}
                              type="text"
                              className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-legal-gold focus:border-legal-gold"
                              placeholder="Why clients connect header"
                            />
                            {errors.whyClientConnectPoints?.[index]?.header && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.whyClientConnectPoints[index]?.header?.message}
                              </p>
                            )}
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                              {...register(`whyClientConnectPoints.${index}.description`)}
                              rows={4}
                              className="mt-1 block w-full rounded-lg border-gray-300 focus:ring-legal-gold focus:border-legal-gold"
                              placeholder="Explain why prospective clients choose to connect with you."
                            />
                            {errors.whyClientConnectPoints?.[index]?.description && (
                              <p className="mt-1 text-xs text-red-600">
                                {errors.whyClientConnectPoints[index]?.description?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {whyClientConnectError && <p className="mt-2 text-xs text-red-600">{whyClientConnectError}</p>}
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
