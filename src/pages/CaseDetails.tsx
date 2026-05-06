import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGetCaseByIdQuery, useAddHearingMutation, useAddPaymentRecordMutation, useToggleCaseStatusMutation, useUpdateCaseMutation, useDeleteCaseMutation } from '../api/caseApi';
import type { CaseDto, HearingDto, PaymentRecordDto, UpdateCaseRequest } from '../api/caseApi';
import { Scale, Pencil, Calendar, MapPin, User, ArrowLeft, Plus, History, CheckCircle, Archive, Info, Inbox, LogOut, LayoutDashboard, Briefcase, CreditCard, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import dayjs from 'dayjs';
import MobileNav from '../components/MobileNav';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const caseId = id ? Number(id) : NaN;
  const shouldSkip = !id || Number.isNaN(caseId);
  const pageSize = 3;
  const [currentPage, setCurrentPage] = useState(1);
  const { data: caseData, isLoading, error } = useGetCaseByIdQuery(
    { id: caseId, pageNumber: currentPage, pageSize },
    { skip: shouldSkip }
  );
  const [addHearing] = useAddHearingMutation();
  const [addPaymentRecord] = useAddPaymentRecordMutation();
  const [updateCase] = useUpdateCaseMutation();
  const [deleteCase] = useDeleteCaseMutation();
  const [toggleStatus] = useToggleCaseStatusMutation();
  
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDelete = async () => {
    if (!caseData) return;
    try {
      await deleteCase(caseData.id).unwrap();
      navigate('/cases');
    } catch {
      alert('Failed to delete case');
    }
  };

  const handleToggleStatus = async () => {
    if (!caseData) return;
    try {
      await toggleStatus(caseData.id).unwrap();
    } catch {
      alert('Failed to toggle status');
    }
  };

  if (shouldSkip) return <div className="p-8 text-center text-red-600">Invalid case id.</div>;
  if (isLoading) return null;
  if (error || !caseData) {
    const status = (error as { status?: number } | null | undefined)?.status;
    if (status === 401) {
      dispatch(logout());
      navigate('/login');
      return null;
    }
    if (status === 404) return <div className="p-8 text-center text-red-600">Case not found.</div>;
    if (status === 403) return <div className="p-8 text-center text-red-600">Access denied.</div>;
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load case details.
      </div>
    );
  }

  const upcomingHearing = caseData.hearings && caseData.hearings.length > 0
    ? [...caseData.hearings]
        .filter(h => new Date(h.hearingDate) >= new Date())
        .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())[0]
    : null;

  const formatINR = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);

  const paymentModeLabel = (mode: unknown) => {
    const m = Number(mode);
    if (m === 0) return 'Cash';
    if (m === 1) return 'UPI';
    if (m === 2) return 'GPay';
    if (m === 3) return 'PhonePe';
    if (m === 4) return 'Bank Transfer';
    return String(mode);
  };

  const hearings = (caseData.hearings || []) as HearingDto[];
  const paymentRecords = (caseData.paymentRecords || []) as PaymentRecordDto[];
  const hearingsTotalCount = Number(caseData.hearingsTotalCount || 0);
  const totalPages = Math.max(1, Math.ceil(hearingsTotalCount / pageSize));

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
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
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-gray-200">
          <div className="flex items-center space-x-3 min-w-0">
            <MobileNav onLogout={handleLogout} />
            <button onClick={() => navigate('/cases')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-legal-corporate truncate">Case Overview</h1>
          </div>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-900">{getUserDisplayName(user)}</p>
              <p className="text-xs text-gray-500">Professional Account</p>
            </div>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-legal-gold flex items-center justify-center text-legal-dark font-bold shrink-0">
              {getUserInitial(user)}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full min-w-0">
          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2 bg-gradient-to-br from-legal-dark to-legal-corporate p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="min-w-0">
                    <span className="text-legal-gold text-xs font-bold uppercase tracking-widest">Case Profile</span>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1 break-words">{caseData.caseNumber}</h2>
                    <p className="text-gray-300 mt-1 break-words">{caseData.clientName}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all"
                        title="Edit Case"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg transition-all"
                        title="Delete Case"
                      >
                        <Archive className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleToggleStatus}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 self-start ${
                      caseData.status === 0 
                        ? 'border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/20' 
                        : 'border-gray-400/30 bg-gray-400/10 text-gray-400 hover:bg-gray-400/20'
                    }`}
                  >
                    {caseData.status === 0 ? 'STATUS: ACTIVE' : 'STATUS: CLOSED'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-10">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <User className="h-5 w-5 text-legal-gold" />
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px] uppercase font-bold tracking-tight">Presiding Judge</p>
                      <p className="text-sm font-semibold">{caseData.judgeName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <Calendar className="h-5 w-5 text-legal-gold" />
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px] uppercase font-bold tracking-tight">Case Start Date</p>
                      <p className="text-sm font-semibold">{caseData.caseStartDate ? new Date(caseData.caseStartDate).toLocaleDateString() : 'Not Set'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Scale className="absolute -bottom-10 -right-10 h-64 w-64 text-white/5 rotate-12" />
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div className="bg-legal-gold/10 p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-legal-gold" />
              </div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Next Hearing</h3>
              <p className="text-xl font-black text-legal-corporate mt-2">
                {upcomingHearing ? dayjs(upcomingHearing.hearingDate).format('DD MMM YYYY') : 'No Upcoming'}
              </p>
              {upcomingHearing && (
                <>
                  <div className="flex items-center text-sm font-bold text-legal-gold mt-1">
                    <Clock className="h-3 w-3 mr-1" /> {dayjs(upcomingHearing.hearingDate).format('hh:mm A')}
                  </div>
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <MapPin className="h-3 w-3 mr-1" /> {upcomingHearing.location || 'Court Premises'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hearing Timeline */}
            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-legal-corporate" />
                  <h3 className="text-lg font-bold text-legal-corporate">Hearing Timeline</h3>
                </div>
                <button 
                  onClick={() => setShowAddHearing(true)}
                  className="bg-legal-corporate text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 hover:bg-legal-dark transition-all shadow-md w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Next Hearing</span>
                </button>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-gray-200">
                {hearings.map((h, idx) => (
                  <div key={h.id} className="relative pl-10 group">
                    <div className={`absolute left-2 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-colors ${
                      new Date(h.hearingDate) < new Date() ? 'bg-gray-400' : 'bg-legal-gold'
                    }`} />
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group-hover:border-legal-gold/30 transition-all">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-legal-corporate">
                            {dayjs(h.hearingDate).format('dddd, DD MMMM YYYY')}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-1">
                            <div className="flex items-center text-xs font-bold text-legal-gold">
                              <Clock className="h-3 w-3 mr-1" /> {dayjs(h.hearingDate).format('hh:mm A')}
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" /> {h.location || 'Default Court Room'}
                            </div>
                          </div>
                        </div>
                        {idx === 0 && (
                          <span className="bg-legal-gold/10 text-legal-gold text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">Latest</span>
                        )}
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 italic border-l-4 border-gray-200 break-words">
                        "{h.notes || 'No specific notes recorded for this hearing.'}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hearingsTotalCount > pageSize && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 bg-white text-legal-corporate hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                  >
                    Previous
                  </button>
                  <div className="text-sm font-bold text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-legal-corporate text-white hover:bg-legal-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Side Info */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h4 className="text-sm font-bold text-legal-corporate mb-4 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-legal-gold" /> Court Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Forum</p>
                    <p className="text-sm text-gray-700">{caseData.courtName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Address</p>
                    <p className="text-sm text-gray-700">{caseData.courtAddress || 'Not Provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-legal-corporate" />
                <h3 className="text-lg font-bold text-legal-corporate">Payment Info</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-legal-gold text-legal-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-500 transition-all shadow-md w-full sm:w-auto"
              >
                Update Payment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-legal-dark rounded-2xl p-6 text-white flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/60">Total Fees Collected</p>
                  <p className="text-2xl font-black text-legal-gold mt-2">{formatINR(Number(caseData.totalFeesCollected || 0))}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-legal-gold" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Net Balance</p>
                  <p className="text-2xl font-black text-legal-corporate mt-2">{formatINR(Number(caseData.totalBalance || 0))}</p>
                </div>
                <div className="bg-legal-gold/10 p-3 rounded-xl">
                  <Scale className="h-6 w-6 text-legal-gold" />
                </div>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {paymentRecords.map((p) => (
                <div key={p.id} className="border border-gray-100 rounded-2xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className={`text-sm font-black ${Number(p.type) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(p.type) === 0 ? 'Credit' : 'Deduct'}
                      </div>
                      <div className="text-xs text-gray-500 font-semibold mt-1">
                        {dayjs(p.transactionDate).format('DD MMM YYYY, hh:mm A')}
                      </div>
                      <div className="text-xs text-gray-600 font-semibold mt-2">
                        {paymentModeLabel(p.mode)}
                      </div>
                    </div>
                    <div className={`text-right text-sm font-black shrink-0 ${Number(p.type) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatINR(Number(p.amount || 0))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-3 break-words">
                    {p.note || '-'}
                  </div>
                </div>
              ))}
              {paymentRecords.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-500">
                  No payment records yet. Use “Update Payment” to add one.
                </div>
              )}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Mode</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                        {dayjs(p.transactionDate).format('DD MMM YYYY, hh:mm A')}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={Number(p.type) === 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(p.type) === 0 ? 'Credit' : 'Deduct'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                        {paymentModeLabel(p.mode)}
                      </td>
                      <td className={`px-6 py-4 text-sm font-black text-right ${Number(p.type) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatINR(Number(p.amount || 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 break-words">
                        {p.note || '-'}
                      </td>
                    </tr>
                  ))}
                  {paymentRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No payment records yet. Use “Update Payment” to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Hearing Modal */}
      {showAddHearing && (
        <HearingModal 
          onClose={() => setShowAddHearing(false)}
          onSave={async (data) => {
            try {
              await addHearing({ caseId: caseData.id, ...data }).unwrap();
              setShowAddHearing(false);
            } catch {
              alert('Failed to log next hearing');
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-gray-100 text-center">
            <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Archive className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-legal-corporate mb-2">Delete Case?</h2>
            <p className="text-sm text-gray-500 mb-8">This will permanently remove this case and all its hearing history. This action cannot be undone.</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleDelete}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                Yes, Delete Permanently
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {isEditing && (
        <CaseEditModal 
          caseData={caseData}
          onClose={() => setIsEditing(false)}
          onSave={async (data) => {
            try {
              await updateCase({
                id: caseData.id,
                data: {
                  ...data,
                  caseNumber: data.caseNumber?.trim() || caseData.caseNumber,
                  judgeName: data.judgeName?.trim() || '',
                  courtAddress: data.courtAddress?.trim() || '',
                  caseDate: caseData.caseDate,
                },
              }).unwrap();
              setIsEditing(false);
            } catch {
              alert('Failed to update case');
            }
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSave={async (data) => {
            try {
              await addPaymentRecord({ caseId: caseData.id, ...data }).unwrap();
              setShowPaymentModal(false);
            } catch {
              alert('Failed to update payment');
            }
          }}
        />
      )}
    </div>
  );
};

type HearingFormData = { hearingDate: string; location: string; notes: string };
type PaymentFormData = { amount: number; type: number; mode: number; note?: string; transactionDate?: string };

type CaseEditModalProps = {
  caseData: CaseDto;
  onClose: () => void;
  onSave: (data: UpdateCaseRequest) => void;
};

const CaseEditModal = ({ caseData, onClose, onSave }: CaseEditModalProps) => {
  const [formData, setFormData] = useState<UpdateCaseRequest>({
    caseNumber: caseData.caseNumber,
    judgeName: caseData.judgeName || '',
    courtAddress: caseData.courtAddress || '',
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-legal-corporate mb-6">Edit Case Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Case Number</label>
            <input 
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.caseNumber}
              onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Presiding Judge</label>
            <input 
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.judgeName || ''}
              onChange={(e) => setFormData({...formData, judgeName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Court Address</label>
            <textarea 
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              rows={3}
              value={formData.courtAddress || ''}
              onChange={(e) => setFormData({...formData, courtAddress: e.target.value})}
            />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-10">
          <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-gray-700 font-bold w-full sm:w-auto">Cancel</button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-8 py-3 bg-legal-corporate text-white rounded-xl font-bold hover:bg-legal-dark shadow-lg shadow-legal-corporate/20 transition-all w-full sm:w-auto"
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

type HearingModalProps = { onClose: () => void; onSave: (data: HearingFormData) => void };

const HearingModal = ({ onClose, onSave }: HearingModalProps) => {
  const [formData, setFormData] = useState({ hearingDate: '', location: '', notes: '' });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100 animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-legal-corporate mb-2">Schedule Next Hearing</h2>
        <p className="text-sm text-gray-500 mb-8">Maintain a chronological history of this case.</p>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time of Hearing</label>
            <input 
              type="datetime-local"
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              onChange={(e) => setFormData({...formData, hearingDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Location/Room</label>
            <input 
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              placeholder="e.g. Court Room 12"
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Notes/Purpose</label>
            <textarea 
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              placeholder="Record purpose of hearing or directions given..."
              rows={3}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-10">
          <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-gray-700 font-bold w-full sm:w-auto">Cancel</button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-8 py-3 bg-legal-corporate text-white rounded-xl font-bold hover:bg-legal-dark shadow-lg shadow-legal-corporate/20 transition-all w-full sm:w-auto"
          >
            Log Hearing
          </button>
        </div>
      </div>
    </div>
  );
};

type PaymentModalProps = { onClose: () => void; onSave: (data: PaymentFormData) => void };

const PaymentModal = ({ onClose, onSave }: PaymentModalProps) => {
  const [formData, setFormData] = useState({
    type: 0,
    amount: '',
    mode: 0,
    note: '',
    transactionDate: dayjs().format('YYYY-MM-DDTHH:mm'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-100 animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl font-bold text-legal-corporate mb-2">Update Payment</h2>
        <p className="text-sm text-gray-500 mb-8">Manual entry for record keeping only.</p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Action Type</label>
            <select
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
            >
              <option value={0}>Credit (Money Received)</option>
              <option value={1}>Deduct (Refund/Expense)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g., 5000"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Payment Mode</label>
            <select
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.mode}
              onChange={(e) => setFormData({ ...formData, mode: Number(e.target.value) })}
            >
              <option value={0}>Cash</option>
              <option value={1}>UPI</option>
              <option value={2}>GPay</option>
              <option value={3}>PhonePe</option>
              <option value={4}>Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Date</label>
            <input
              type="datetime-local"
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Note</label>
            <textarea
              className="w-full border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none transition-all"
              rows={3}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="e.g., Paid by client's brother / Refund for cancelled hearing"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-10">
          <button onClick={onClose} className="px-6 py-3 text-gray-500 hover:text-gray-700 font-bold w-full sm:w-auto">Cancel</button>
          <button
            onClick={() =>
              onSave({
                type: formData.type,
                amount: Number(formData.amount),
                mode: formData.mode,
                note: formData.note?.trim() || undefined,
                transactionDate: formData.transactionDate ? new Date(formData.transactionDate).toISOString() : undefined,
              })
            }
            className="px-8 py-3 bg-legal-corporate text-white rounded-xl font-bold hover:bg-legal-dark shadow-lg shadow-legal-corporate/20 transition-all w-full sm:w-auto"
          >
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
