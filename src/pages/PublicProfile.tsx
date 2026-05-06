import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  Download,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { useGetPublicProfileQuery, useSubmitPublicLeadMutation } from '../api/apiSlice';

type LeadFormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  matterType: string;
  message: string;
};

const defaultLeadForm: LeadFormState = {
  fullName: '',
  email: '',
  phoneNumber: '',
  matterType: '',
  message: '',
};

const sanitizeVCardValue = (value?: string | null) =>
  (value ?? '').replace(/\r?\n/g, ' ').replace(/,/g, '\\,').replace(/;/g, '\\;');

const PublicProfile = () => {
  const { advocateId } = useParams<{ advocateId: string }>();
  const { data: profile, isLoading, isError } = useGetPublicProfileQuery(advocateId ?? '', {
    skip: !advocateId,
  });
  const [submitPublicLead, { isLoading: isSubmittingLead }] = useSubmitPublicLeadMutation();
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>(defaultLeadForm);
  const [leadErrorMessage, setLeadErrorMessage] = useState('');
  const [leadSuccessMessage, setLeadSuccessMessage] = useState('');

  const initials = useMemo(() => {
    const source = profile?.fullName?.trim() || 'LT';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profile?.fullName]);

  const downloadVCard = () => {
    if (!profile) return;

    const fullName = sanitizeVCardValue(profile.fullName);
    const firstName = sanitizeVCardValue(profile.firstName);
    const lastName = sanitizeVCardValue(profile.lastName);
    const email = sanitizeVCardValue(profile.email);
    const phone = sanitizeVCardValue(profile.phoneNumber);
    const address = sanitizeVCardValue(profile.officeAddress);
    const organization = 'LegisTrack';

    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fullName}`,
      `N:${lastName};${firstName};;;`,
      `ORG:${organization}`,
      phone ? `TEL;TYPE=WORK,VOICE:${phone}` : '',
      email ? `EMAIL;TYPE=INTERNET:${email}` : '',
      address ? `ADR;TYPE=WORK:;;${address};;;;` : '',
      `NOTE:Public profile - ${sanitizeVCardValue(profile.profileSlug)}`,
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${profile.profileSlug || 'advocate'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLeadFieldChange = (field: keyof LeadFormState, value: string) => {
    setLeadForm((current) => ({ ...current, [field]: value }));
  };

  const openQuestionnaire = () => {
    setLeadErrorMessage('');
    setLeadSuccessMessage('');
    setIsQuestionnaireOpen(true);
  };

  const closeQuestionnaire = () => {
    setLeadErrorMessage('');
    setIsQuestionnaireOpen(false);
  };

  const submitQuestionnaire = async () => {
    if (!profile || !advocateId) return;

    setLeadErrorMessage('');

    try {
      const response = await submitPublicLead({
        advocateId,
        fullName: leadForm.fullName.trim(),
        email: leadForm.email.trim(),
        phoneNumber: leadForm.phoneNumber.trim(),
        matterType: leadForm.matterType.trim(),
        message: leadForm.message.trim(),
      }).unwrap();

      setLeadSuccessMessage(response.message || 'Consultation request submitted successfully.');
      setIsQuestionnaireOpen(false);
      setLeadForm(defaultLeadForm);
    } catch (error) {
      const errorData = error as
        | { data?: { message?: string; errors?: string[] } }
        | undefined;
      const details = errorData?.data?.errors?.join(' ');
      setLeadErrorMessage(details || errorData?.data?.message || 'Failed to submit consultation request.');
    }
  };

  if (isLoading) {
    return null;
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-legal-gold" />
          <h1 className="mt-4 text-2xl font-bold">Advocate Profile Unavailable</h1>
          <p className="mt-3 text-sm text-slate-300">
            The public profile you requested could not be found. Please verify the profile link and try again.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-legal-gold px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
          >
            Go To LegisTrack
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white max-w-full overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_35%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(2,6,23,1))]" />
      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-legal-gold/15 text-legal-gold ring-1 ring-legal-gold/30">
                <Scale className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">LegisTrack</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Verified Advocate Profile</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadVCard}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                <span>Download VCard</span>
              </button>
              <button
                type="button"
                onClick={openQuestionnaire}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-legal-gold px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
              >
                <Star className="h-4 w-4" />
                <span>Connect / Consult</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {leadSuccessMessage && (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
              {leadSuccessMessage}
            </div>
          )}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-legal-gold/20 to-white/10 text-3xl font-bold text-legal-gold ring-1 ring-white/10">
                  {initials || <UserRound className="h-10 w-10" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{profile.fullName}</h1>
                    {profile.isVerified && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        <BadgeCheck className="h-4 w-4" />
                        Verified Advocate
                      </span>
                    )}
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    {profile.publicBio ||
                      'Trusted legal counsel with a professional public profile designed to help prospective clients connect quickly, verify credentials, and begin a consultation with confidence.'}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-200">
                    {profile.barCouncilId && (
                      <div className="rounded-2xl border border-legal-gold/25 bg-legal-gold/10 px-4 py-2">
                        Verified Bar Council ID: <span className="font-semibold text-legal-gold">{profile.barCouncilId}</span>
                      </div>
                    )}
                    {profile.gender && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                        Gender: <span className="font-semibold text-white">{profile.gender}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <h2 className="text-lg font-semibold text-white">Contact Details</h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Phone className="mt-0.5 h-5 w-5 text-legal-gold" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</p>
                    <p className="mt-1 break-words text-sm text-white">{profile.phoneNumber || 'Available on request'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Mail className="mt-0.5 h-5 w-5 text-legal-gold" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                    <p className="mt-1 break-words text-sm text-white">{profile.email || 'Available on request'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 text-legal-gold" />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Office</p>
                    <p className="mt-1 break-words text-sm text-white">{profile.officeAddress || 'Address available after consultation'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={downloadVCard}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Add To Contacts
                </button>
                <button
                  type="button"
                  onClick={openQuestionnaire}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-legal-gold px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Consult Now
                </button>
              </div>
            </aside>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white">Areas of Practice</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Clear expertise signals help potential clients quickly understand fit and build trust.
                  </p>
                </div>
                <div className="rounded-full border border-legal-gold/30 bg-legal-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-legal-gold">
                  Expertise
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {profile.practiceAreas.map((area) => (
                  <div
                    key={area}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-sm font-medium text-white shadow-sm"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
              <h2 className="text-2xl font-bold text-white">Why Clients Connect</h2>
              <div className="mt-6 space-y-4">
                {profile.whyClientConnectPoints.map((point, index) => (
                  <div key={`${point.header}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{point.header}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{point.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      {isQuestionnaireOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={closeQuestionnaire}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="consult-dialog-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-legal-gold">Lead Questionnaire</p>
                <h2 id="consult-dialog-title" className="mt-2 text-2xl font-bold text-white">
                  Start Your Consultation
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Share your matter details to prepare a focused first conversation with {profile.fullName}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuestionnaire}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close consultation questionnaire"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {leadErrorMessage && (
              <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {leadErrorMessage}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-200">Your Name</label>
                <input
                  type="text"
                  value={leadForm.fullName}
                  onChange={(event) => handleLeadFieldChange('fullName', event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-legal-gold focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200">Email</label>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(event) => handleLeadFieldChange('email', event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-legal-gold focus:outline-none"
                  placeholder="Enter your email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200">Phone Number</label>
                <input
                  type="tel"
                  value={leadForm.phoneNumber}
                  onChange={(event) => handleLeadFieldChange('phoneNumber', event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-legal-gold focus:outline-none"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200">Matter Type</label>
                <select
                  value={leadForm.matterType}
                  onChange={(event) => handleLeadFieldChange('matterType', event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-legal-gold focus:outline-none"
                >
                  <option value="">Select a matter type</option>
                  {profile.practiceAreas.length === 0 && (
                    <option value="General Consultation" className="text-slate-900">
                      General Consultation
                    </option>
                  )}
                  {profile.practiceAreas.map((area) => (
                    <option key={area} value={area} className="text-slate-900">
                      {area}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200">Brief Case Summary</label>
                <textarea
                  value={leadForm.message}
                  onChange={(event) => handleLeadFieldChange('message', event.target.value)}
                  rows={5}
                  className="mt-2 block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-legal-gold focus:outline-none"
                  placeholder="Describe your legal matter briefly"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeQuestionnaire}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitQuestionnaire}
                disabled={isSubmittingLead}
                className="rounded-xl bg-legal-gold px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmittingLead ? 'Submitting...' : 'Send Consultation Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
