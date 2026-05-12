import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  Scale,
  ShieldCheck,
  StickyNote,
  Target,
  User,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import {
  LeadStatus,
  useGetLeadByIdQuery,
  useUpdateLeadStatusMutation,
} from '../api/apiSlice';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import MobileNav from '../components/MobileNav';
import StatusProgressBar, { getLeadStatusMeta } from '../components/StatusProgressBar';

const LeadDetailPage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: lead, isLoading, error } = useGetLeadByIdQuery(id, { skip: !id });
  const [updateLeadStatus, { isLoading: isUpdatingStatus }] = useUpdateLeadStatusMutation();
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const closeModal = () => {
    setPendingStatus(null);
    setStatusNote('');
    setOutcomeNote('');
  };

  const handleStatusSelection = (status: LeadStatus) => {
    if (!lead || lead.status === status) return;

    setPendingStatus(status);
    setStatusNote('');
    setOutcomeNote(status === LeadStatus.Converted || status === LeadStatus.Lost ? lead.outcomeNote ?? '' : '');
  };

  const submitStatusUpdate = async () => {
    if (!lead || pendingStatus === null) return;

    try {
      await updateLeadStatus({
        id: lead.id,
        status: pendingStatus,
        note: statusNote.trim(),
        outcomeNote:
          pendingStatus === LeadStatus.Converted || pendingStatus === LeadStatus.Lost
            ? outcomeNote.trim()
            : undefined,
      }).unwrap();
      closeModal();
    } catch (updateError) {
      void updateError;
    }
  };

  if (isLoading) return null;

  return (
    <>
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
            <Link to="/leads" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
              <Inbox className="h-5 w-5" />
              <span>Leads</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
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
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-gray-400">Lead Detail</p>
                <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0 truncate">
                  {lead?.fullName ?? 'Lead'}
                </h1>
              </div>
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
            <Link
              to="/leads"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-legal-corporate hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back To Leads
            </Link>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load lead details.
              </div>
            )}

            {!error && !lead && (
              <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <Inbox className="mx-auto mb-4 h-12 w-12 text-gray-200" />
                <p className="text-gray-500">Lead not found.</p>
              </div>
            )}

            {lead && (
              <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="space-y-6">
                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-legal-gold">Prospective Client</p>
                        <h2 className="mt-2 text-3xl font-bold text-legal-corporate break-words">{lead.fullName}</h2>
                        <p className="mt-2 text-sm text-gray-500">
                          Submitted {dayjs(lead.submittedAtUtc).format('DD MMM YYYY, hh:mm A')}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getLeadStatusMeta(lead.status).colorClass}`}>
                        {getLeadStatusMeta(lead.status).label}
                      </span>
                    </div>

                    <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-legal-gold" />
                        <p className="text-sm font-semibold text-legal-corporate">Lifecycle Pipeline</p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Every status change requires a note so your follow-up trail stays documented.
                      </p>
                      <div className="mt-4">
                        <StatusProgressBar
                          currentStatus={lead.status}
                          disabled={isUpdatingStatus}
                          onStatusChange={handleStatusSelection}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-legal-gold mt-1 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Email</p>
                          <p className="mt-1 text-sm text-gray-800 break-words">{lead.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-legal-gold mt-1 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Phone</p>
                          <p className="mt-1 text-sm text-gray-800 break-words">{lead.phoneNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Matter Type</p>
                    <p className="mt-2 text-sm font-semibold text-legal-corporate">{lead.matterType}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-legal-gold" />
                      <p className="text-sm font-semibold text-legal-corporate">Lead Summary</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-700 break-words">{lead.message}</p>
                  </div>

                  {(lead.status === LeadStatus.Converted || lead.status === LeadStatus.Lost) && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4 text-legal-gold" />
                        <p className="text-sm font-semibold text-legal-corporate">Outcome Note</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-gray-700 break-words">
                        {lead.outcomeNote || 'No outcome note recorded.'}
                      </p>
                    </div>
                  )}
                </section>

                <aside className="space-y-6">
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-legal-gold" />
                      <p className="text-sm font-semibold text-legal-corporate">Last Activity</p>
                    </div>
                    <p className="mt-3 text-sm text-gray-700">
                      Updated {dayjs(lead.updatedAt).format('DD MMM YYYY, hh:mm A')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-legal-gold" />
                      <p className="text-sm font-semibold text-legal-corporate">Status History</p>
                    </div>
                    <div className="mt-6 space-y-5">
                      {lead.statusHistory.length === 0 && (
                        <p className="text-sm text-gray-500">No status notes have been logged yet.</p>
                      )}

                      {lead.statusHistory.map((history) => (
                        <div key={history.id} className="relative pl-6">
                          <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-legal-gold" />
                          <span className="absolute left-[4px] top-5 bottom-[-18px] w-px bg-gray-200 last:hidden" />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getLeadStatusMeta(history.fromStatus).colorClass}`}>
                              {getLeadStatusMeta(history.fromStatus).label}
                            </span>
                            <span className="text-xs text-gray-400">to</span>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getLeadStatusMeta(history.toStatus).colorClass}`}>
                              {getLeadStatusMeta(history.toStatus).label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-gray-700 break-words">{history.note}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            {dayjs(history.createdAtUtc).format('DD MMM YYYY, hh:mm A')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </main>
        </div>
      </div>

      {lead && pendingStatus !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-legal-corporate">Update Lead Status</h2>
            <p className="mt-2 text-sm text-gray-500">
              Add a note for this follow-up update so your team can track what happened.
            </p>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Status Update Note</label>
              <textarea
                rows={4}
                value={statusNote}
                onChange={(event) => setStatusNote(event.target.value)}
                className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-legal-gold focus:outline-none focus:ring-2 focus:ring-legal-gold/30"
                placeholder="e.g. Lead rejected the call. Need to call again tomorrow."
              />
            </div>

            {(pendingStatus === LeadStatus.Converted || pendingStatus === LeadStatus.Lost) && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Outcome Note</label>
                <textarea
                  rows={4}
                  value={outcomeNote}
                  onChange={(event) => setOutcomeNote(event.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-legal-gold focus:outline-none focus:ring-2 focus:ring-legal-gold/30"
                  placeholder={
                    pendingStatus === LeadStatus.Converted
                      ? 'e.g. Retainer signed and onboarding started.'
                      : 'e.g. Fees were too high for the client.'
                  }
                />
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitStatusUpdate}
                disabled={isUpdatingStatus}
                className="rounded-xl bg-legal-corporate px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-legal-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingStatus ? 'Saving...' : 'Save Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadDetailPage;
