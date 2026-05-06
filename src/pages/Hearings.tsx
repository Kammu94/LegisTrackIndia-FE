import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGetHearingsQuery } from '../api/caseApi';
import { Scale, Calendar, MapPin, Search, Filter, Clock, ArrowRight, LayoutDashboard, Briefcase, LogOut, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import dayjs from 'dayjs';
import MobileNav from '../components/MobileNav';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';

const Hearings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    caseSearch: '',
    status: ''
  });

  const { data: hearings, isLoading, error } = useGetHearingsQuery({
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    caseSearch: filters.caseSearch || undefined,
    status: filters.status !== '' ? Number(filters.status) : undefined
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex max-w-full overflow-x-hidden">
      {/* Sidebar */}
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
          <Link to="/hearings" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
            <Calendar className="h-5 w-5" />
            <span>Hearings</span>
          </Link>
          <Link to="/profile" className="flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center space-x-3 p-3 w-full rounded-lg text-red-400 hover:bg-red-900/20 transition-colors">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm min-h-16 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <MobileNav onLogout={handleLogout} />
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">Global Hearings</h1>
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center">
              <span className="font-bold mr-2">Error:</span> Failed to load hearings. Please try again later.
            </div>
          )}
          {/* Filters */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Case # or Client" 
                  className="pl-10 w-full border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                  value={filters.caseSearch}
                  onChange={(e) => setFilters({...filters, caseSearch: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input 
                  type="date" 
                  className="flex-1 border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select 
                  className="flex-1 border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="0">Active Cases</option>
                  <option value="1">Closed Cases</option>
                </select>
              </div>
              <button 
                onClick={() => setFilters({ startDate: '', endDate: '', caseSearch: '', status: '' })}
                className="text-sm font-bold text-legal-corporate hover:text-legal-gold transition-colors w-full md:w-auto md:self-center"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          <div className="space-y-4 md:hidden">
            {hearings?.map((h) => (
              <div key={h.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-legal-corporate">{dayjs(h.hearingDate).format('DD MMM YYYY')}</p>
                    <p className="text-xs text-legal-gold font-bold flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1 shrink-0" /> {dayjs(h.hearingDate).format('hh:mm A')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/cases/${h.caseId}`)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-legal-gold hover:text-legal-dark transition-all shrink-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-gray-900 break-words">{h.caseNumber}</p>
                  <p className="text-xs text-gray-500 break-words">{h.clientName}</p>
                </div>
                <div className="mt-3 flex items-start text-sm text-gray-600">
                  <MapPin className="h-3 w-3 mr-1 mt-1 text-gray-400 shrink-0" />
                  <span className="break-words">{h.location || 'N/A'}</span>
                </div>
              </div>
            ))}
            {!isLoading && hearings?.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-500">
                No hearings found matching your criteria.
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Hearing Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Case Info</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Link</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hearings?.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-legal-corporate">{dayjs(h.hearingDate).format('DD MMM YYYY')}</p>
                      <p className="text-xs text-legal-gold font-bold flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {dayjs(h.hearingDate).format('hh:mm A')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{h.caseNumber}</p>
                      <p className="text-xs text-gray-500">{h.clientName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" /> {h.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/cases/${h.caseId}`)}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-legal-gold hover:text-legal-dark transition-all group"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && hearings?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No hearings found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Hearings;
