import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  Scale,
  User,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useGetMyLeadsQuery } from '../api/apiSlice';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import MobileNav from '../components/MobileNav';

const LeadsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: leads, isLoading, error } = useGetMyLeadsQuery();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const totalLeads = leads?.length ?? 0;
  const todayLeads =
    leads?.filter((lead) => dayjs(lead.submittedAtUtc).isSame(dayjs(), 'day')).length ?? 0;
  const latestLeadAt = leads?.[0]?.submittedAtUtc;

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
              <h3 className="text-gray-500 text-sm font-medium">Received Today</h3>
              <p className="text-3xl font-bold text-legal-gold mt-2">{todayLeads}</p>
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
                {leads?.map((lead) => (
                  <div key={lead.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-legal-corporate break-words">{lead.fullName}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {dayjs(lead.submittedAtUtc).format('DD MMM YYYY, hh:mm A')}
                        </p>
                      </div>
                      <span className="rounded-full bg-legal-gold/10 px-3 py-1 text-[11px] font-semibold text-legal-corporate">
                        {lead.matterType}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-legal-gold mt-0.5" />
                        <span className="break-words">{lead.email}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-legal-gold mt-0.5" />
                        <span className="break-words">{lead.phoneNumber}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquareText className="h-4 w-4 shrink-0 text-legal-gold mt-0.5" />
                        <span className="break-words">{lead.message}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospective Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matter Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads?.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors align-top">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-legal-corporate">{lead.fullName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 break-words">{lead.email}</div>
                          <div className="text-xs text-gray-500 mt-1">{lead.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{lead.matterType}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-md break-words">{lead.message}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {dayjs(lead.submittedAtUtc).format('DD MMM YYYY, hh:mm A')}
                        </td>
                      </tr>
                    ))}
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
