import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Calendar, Inbox, LayoutDashboard, LogOut, Scale, User } from 'lucide-react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { LeadStatus, useGetMyLeadsQuery, type Lead } from '../api/apiSlice';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import MobileNav from '../components/MobileNav';
import { getLeadStatusMeta } from '../components/StatusProgressBar';

const sortLeads = (items: Lead[]) =>
  [...items].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status - right.status;
    }

    return dayjs(right.updatedAt || right.submittedAtUtc).valueOf() - dayjs(left.updatedAt || left.submittedAtUtc).valueOf();
  });

const LeadsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: leads, isLoading, error } = useGetMyLeadsQuery();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const sortedLeads = sortLeads(leads ?? []);
  const totalLeads = sortedLeads.length;
  const newLeadsCount = sortedLeads.filter((lead) => lead.status === LeadStatus.New).length;
  const latestLeadAt = sortedLeads[0]?.submittedAtUtc;

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
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">Incoming Leads</h1>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Total Leads</h3>
              <p className="text-3xl font-bold text-legal-corporate mt-2">{totalLeads}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">New Leads</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{newLeadsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Latest Submission</h3>
              <p className="text-sm font-semibold text-gray-900 mt-3">
                {latestLeadAt ? dayjs(latestLeadAt).format('DD MMM YYYY, hh:mm A') : 'No leads yet'}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load leads. Please try again.
            </div>
          )}

          {!error && totalLeads === 0 && (
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center py-12 sm:py-20">
              <div className="max-w-md mx-auto">
                <Inbox className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold text-legal-corporate">No leads yet</h2>
                <p className="text-gray-500 mt-2">
                  New consultation requests from your public profile will appear here automatically.
                </p>
              </div>
            </div>
          )}

          {!error && totalLeads > 0 && (
            <>
              <div className="mt-8 space-y-4 md:hidden">
                {sortedLeads.map((lead) => {
                  const statusMeta = getLeadStatusMeta(lead.status);

                  return (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-legal-gold/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-legal-corporate break-words">{lead.fullName}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {dayjs(lead.submittedAtUtc).format('DD MMM YYYY, hh:mm A')}
                          </p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${statusMeta.colorClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-gray-700 break-words">{lead.message}</p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-legal-gold/10 px-3 py-1 text-[11px] font-semibold text-legal-corporate">
                          {lead.matterType}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-legal-corporate">
                          View Lead
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="hidden md:block mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospective Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedLeads.map((lead) => {
                      const statusMeta = getLeadStatusMeta(lead.status);

                      return (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors align-top">
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-legal-corporate">{lead.fullName}</div>
                            <div className="mt-1 text-sm text-gray-500">{lead.email}</div>
                            <div className="mt-2 text-sm text-gray-700 max-w-md break-words">{lead.message}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{lead.matterType}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.colorClass}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {dayjs(lead.submittedAtUtc).format('DD MMM YYYY, hh:mm A')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="inline-flex items-center gap-2 rounded-xl border border-legal-gold/30 px-4 py-2 text-sm font-semibold text-legal-corporate hover:bg-amber-50"
                            >
                              View Lead
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default LeadsPage;
