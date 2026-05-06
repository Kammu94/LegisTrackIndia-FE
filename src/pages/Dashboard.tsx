import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Scale, LogOut, LayoutDashboard, Briefcase, Calendar, Inbox, User } from 'lucide-react';
import MobileNav from '../components/MobileNav';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import { useGetMyLeadsQuery } from '../api/apiSlice';

const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: leads } = useGetMyLeadsQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
          <Link to="/dashboard" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm min-h-16 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <MobileNav onLogout={handleLogout} />
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">Advocate Dashboard</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Total Active Cases</h3>
              <p className="text-3xl font-bold text-legal-corporate mt-2">0</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Hearings Tomorrow</h3>
              <p className="text-3xl font-bold text-legal-gold mt-2">0</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Pending Payments</h3>
              <p className="text-3xl font-bold text-red-600 mt-2"> 0</p>
            </div>
            <Link to="/leads" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 block hover:border-legal-gold/40 transition-colors">
              <h3 className="text-gray-500 text-sm font-medium">Incoming Leads</h3>
              <p className="text-3xl font-bold text-legal-gold mt-2">{leads?.length ?? 0}</p>
            </Link>
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center py-12 sm:py-20">
            <div className="max-w-md mx-auto">
              <Briefcase className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold text-legal-corporate">Welcome to your digital diary</h2>
              <p className="text-gray-500 mt-2">Start by adding your first case to track hearings and payments automatically.</p>
              <button 
                onClick={() => navigate('/cases')}
                className="mt-6 px-6 py-3 bg-legal-gold text-legal-dark font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-md"
              >
                + Add New Case
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
