import { useState } from 'react';
import { useGetCasesQuery, useCreateCaseMutation, useUpdateCaseMutation, useToggleCaseStatusMutation } from '../api/caseApi';
import type { CaseDto, CreateCaseRequest, UpdateCaseRequest } from '../api/caseApi';
import { Scale, Pencil, CheckCircle, Archive, AlertCircle, MapPin, User, Calendar, Inbox, LogOut, LayoutDashboard, Briefcase, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import dayjs from 'dayjs';
import MobileNav from '../components/MobileNav';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';
import { useNotify } from '../notifications/NotificationProvider';

const MyCases = () => {
  const { data: cases, isLoading } = useGetCasesQuery();
  const [createCase] = useCreateCaseMutation();
  const [updateCase] = useUpdateCaseMutation();
  const [toggleStatus] = useToggleCaseStatusMutation();
  const [editingCase, setEditingCase] = useState<CaseDto | null>(null);
  const [isAddingCase, setIsAddingCase] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleStatus(id).unwrap();
      notify({
        severity: 'success',
        title: 'Case Updated',
        message: 'Case status has been updated.',
      });
    } catch (err: unknown) {
      void err;
    }
  };

  if (isLoading) return null;

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
          <Link to="/cases" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm min-h-16 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <MobileNav onLogout={handleLogout} />
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate min-w-0">My Cases</h1>
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-legal-corporate">Case Inventory</h2>
            <button 
              onClick={() => setIsAddingCase(true)}
              className="bg-legal-gold text-legal-dark px-6 py-2 rounded-lg font-bold shadow-md hover:bg-yellow-500 transition-all w-full sm:w-auto"
            >
              + New Case
            </button>
          </div>

          <div className="space-y-4 md:hidden">
            {cases?.map((c) => (
              <div
                key={c.id}
                className={`${c.status === 1 ? 'opacity-60 bg-gray-50' : 'bg-white'} rounded-2xl shadow-sm border border-gray-100 p-4`}
              >
                <button
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="text-left w-full"
                >
                  <div className="text-sm font-bold text-legal-corporate break-words">{c.caseNumber}</div>
                  <div className="text-xs text-gray-500 mt-1 break-words">{c.clientName}</div>
                </button>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center text-[10px] text-gray-400">
                    <Calendar className="h-3 w-3 mr-1 shrink-0" /> {dayjs(c.caseDate).format('DD MMM YYYY')}
                  </div>
                  <div className="flex items-center text-[10px] text-legal-gold font-bold">
                    <Clock className="h-3 w-3 mr-1 shrink-0" /> {dayjs(c.caseDate).format('hh:mm A')}
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="text-gray-900 break-words">{c.courtName}</div>
                  <div className="flex items-start text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1 mt-0.5 shrink-0" /> <span className="break-words">{c.judgeName || 'N/A'}</span>
                  </div>
                  <div className="flex items-start text-[10px] text-gray-400">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" /> <span className="break-words">{c.courtAddress || 'N/A'}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    c.status === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {c.status === 0 ? 'Active' : 'Closed'}
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setEditingCase(c)}
                      className="text-legal-corporate hover:text-legal-gold transition-colors"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(c.id)}
                      className={`${c.status === 0 ? 'text-gray-400 hover:text-green-600' : 'text-green-600 hover:text-gray-600'} transition-colors`}
                      title={c.status === 0 ? "Close Case" : "Reopen Case"}
                    >
                      {c.status === 0 ? <Archive className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(!cases || cases.length === 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-12 text-center text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                <p>No cases found. Start by adding your first case.</p>
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Court & Judge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases?.map((c) => (
                  <tr key={c.id} className={`${c.status === 1 ? 'opacity-60 bg-gray-50' : ''} hover:bg-gray-50 cursor-pointer transition-colors`}>
                  <td className="px-6 py-4" onClick={() => navigate(`/cases/${c.id}`)}>
                      <div className="text-sm font-bold text-legal-corporate">{c.caseNumber}</div>
                      <div className="text-xs text-gray-500">{c.clientName}</div>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center text-[10px] text-gray-400">
                          <Calendar className="h-3 w-3 mr-1" /> {dayjs(c.caseDate).format('DD MMM YYYY')}
                        </div>
                        <div className="flex items-center text-[10px] text-legal-gold font-bold">
                          <Clock className="h-3 w-3 mr-1" /> {dayjs(c.caseDate).format('hh:mm A')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{c.courtName}</div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <User className="h-3 w-3 mr-1" /> {c.judgeName || 'N/A'}
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400 mt-1">
                        <MapPin className="h-3 w-3 mr-1" /> {c.courtAddress || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        c.status === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {c.status === 0 ? 'Active' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => setEditingCase(c)}
                        className="text-legal-corporate hover:text-legal-gold transition-colors"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(c.id)}
                        className={`${c.status === 0 ? 'text-gray-400 hover:text-green-600' : 'text-green-600 hover:text-gray-600'} transition-colors`}
                        title={c.status === 0 ? "Close Case" : "Reopen Case"}
                      >
                        {c.status === 0 ? <Archive className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!cases || cases.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                      <p>No cases found. Start by adding your first case.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingCase && (
        <CaseModal 
          caseData={editingCase} 
          onClose={() => setEditingCase(null)} 
          onSave={async (data) => {
            try {
              const payload: UpdateCaseRequest = {
                clientName: data.clientName.trim(),
                courtName: data.courtName.trim(),
                caseDate: data.caseDate,
                judgeName: data.judgeName?.trim() || '',
                courtAddress: data.courtAddress?.trim() || '',
                caseStartDate: data.caseStartDate || undefined,
              };
              await updateCase({ id: editingCase.id, data: payload }).unwrap();
              setEditingCase(null);
              notify({
                severity: 'success',
                title: 'Case Saved',
                message: 'Case details have been updated.',
              });
            } catch (err: unknown) {
              void err;
            }
          }}
        />
      )}

      {/* Add Modal */}
      {isAddingCase && (
        <CaseModal 
          caseData={{ caseNumber: '', clientName: '', courtName: '', judgeName: '', courtAddress: '', caseDate: new Date().toISOString().split('T')[0] }} 
          onClose={() => setIsAddingCase(false)} 
          isNew={true}
          onSave={async (data) => {
            try {
              const payload: CreateCaseRequest = {
                caseNumber: data.caseNumber,
                clientName: data.clientName,
                courtName: data.courtName,
                caseDate: data.caseDate,
                judgeName: data.judgeName || undefined,
                courtAddress: data.courtAddress || undefined,
                caseStartDate: data.caseStartDate || undefined,
              };
              await createCase(payload).unwrap();
              setIsAddingCase(false);
              notify({
                severity: 'success',
                title: 'Case Created',
                message: 'New case has been created.',
              });
            } catch (err: unknown) {
              void err;
            }
          }}
        />
      )}
    </div>
  );
};

type CaseFormData = {
  caseNumber: string;
  clientName: string;
  courtName: string;
  caseDate: string;
  judgeName?: string | null;
  courtAddress?: string | null;
  caseStartDate?: string | null;
};

type CaseModalProps = {
  caseData: Partial<CaseFormData>;
  onClose: () => void;
  onSave: (data: CaseFormData) => void;
  isNew?: boolean;
};

const CaseModal = ({ caseData, onClose, onSave, isNew }: CaseModalProps) => {
  const [formData, setFormData] = useState<CaseFormData>({
    caseNumber: caseData.caseNumber || '',
    clientName: caseData.clientName || '',
    courtName: caseData.courtName || '',
    caseDate: caseData.caseDate || new Date().toISOString().split('T')[0],
    judgeName: caseData.judgeName || '',
    courtAddress: caseData.courtAddress || '',
    caseStartDate: caseData.caseStartDate || '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-legal-corporate mb-6">{isNew ? 'Add New Case' : 'Edit Case Details'}</h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Number</label>
            <input 
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              value={formData.caseNumber}
              onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
              placeholder="e.g. OS 123/2024"
              disabled={!isNew}
              readOnly={!isNew}
            />
            {!isNew && (
              <p className="mt-1 text-xs text-gray-500">Case number cannot be edited after creation.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Client Name</label>
            <input 
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none"
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
              placeholder="Client's Full Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Court Name</label>
            <input 
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none"
              value={formData.courtName}
              onChange={(e) => setFormData({...formData, courtName: e.target.value})}
              placeholder="e.g. High Court of Delhi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Case Date & Time</label>
            <input 
              type="datetime-local"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none"
              value={formData.caseDate ? formData.caseDate.substring(0, 16) : ''}
              onChange={(e) => setFormData({...formData, caseDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Judge Name</label>
            <input 
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none"
              value={formData.judgeName || ''}
              onChange={(e) => setFormData({...formData, judgeName: e.target.value})}
              placeholder="Hon'ble Justice..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Court Address</label>
            <textarea 
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:ring-2 focus:ring-legal-gold focus:border-legal-gold outline-none"
              value={formData.courtAddress || ''}
              rows={3}
              onChange={(e) => setFormData({...formData, courtAddress: e.target.value})}
              placeholder="Chamber No, Court Complex..."
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium w-full sm:w-auto">Cancel</button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-6 py-2 bg-legal-corporate text-white rounded-lg font-bold hover:bg-legal-dark shadow-md transition-all w-full sm:w-auto"
          >
            {isNew ? 'Create Case' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyCases;
