import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGetHearingsQuery, type HearingListDto } from '../api/caseApi';
import { Scale, Calendar, MapPin, Search, Filter, ArrowRight, LayoutDashboard, Briefcase, Inbox, LogOut, User, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { logout } from '../features/auth/authSlice';
import dayjs from 'dayjs';
import MobileNav from '../components/MobileNav';
import { getUserDisplayName, getUserInitial } from '../features/auth/userDisplay';

type HearingFilters = {
  caseSearch: string;
  status: string;
};

type DailyHearingGroup = {
  dateKey: string;
  date: dayjs.Dayjs;
  hearings: HearingListDto[];
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const currentDate = dayjs();
const currentYear = currentDate.year();
const todayKey = currentDate.format('YYYY-MM-DD');

const groupHearingsByDay = (hearings: HearingListDto[]): DailyHearingGroup[] => {
  const groups = new Map<string, HearingListDto[]>();

  hearings.forEach((hearing) => {
    const dateKey = dayjs(hearing.hearingDate).format('YYYY-MM-DD');
    const existing = groups.get(dateKey) ?? [];
    existing.push(hearing);
    groups.set(dateKey, existing);
  });

  return Array.from(groups.entries())
    .map(([dateKey, items]) => ({
      dateKey,
      date: dayjs(dateKey),
      hearings: [...items].sort((left, right) => dayjs(left.hearingDate).valueOf() - dayjs(right.hearingDate).valueOf()),
    }))
    .sort((left, right) => left.date.valueOf() - right.date.valueOf());
};

const Hearings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentDate.month());
  const [expandedDayKeys, setExpandedDayKeys] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<HearingFilters>({
    caseSearch: '',
    status: '',
  });

  const yearStart = useMemo(() => dayjs(`${selectedYear}-01-01`).startOf('year').toISOString(), [selectedYear]);
  const yearEnd = useMemo(() => dayjs(`${selectedYear}-12-31`).endOf('day').toISOString(), [selectedYear]);

  const { data: hearings, isLoading, error } = useGetHearingsQuery({
    startDate: yearStart,
    endDate: yearEnd,
    caseSearch: filters.caseSearch || undefined,
    status: filters.status !== '' ? Number(filters.status) : undefined,
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear - 1, currentYear, currentYear + 1]);
    hearings?.forEach((hearing) => years.add(dayjs(hearing.hearingDate).year()));
    return Array.from(years).sort((left, right) => right - left);
  }, [hearings]);

  const monthlyGroups = useMemo(
    () =>
      Array.from({ length: 12 }, (_, monthIndex) => {
        const monthHearings = (hearings ?? []).filter((hearing) => dayjs(hearing.hearingDate).month() === monthIndex);

        return {
          monthIndex,
          monthName: monthNames[monthIndex],
          hearingCount: monthHearings.length,
          dailyGroups: groupHearingsByDay(monthHearings),
        };
      }),
    [hearings]
  );

  const selectedMonth = monthlyGroups[selectedMonthIndex];
  const selectedMonthGroups = selectedMonth?.dailyGroups ?? [];
  const totalHearings = hearings?.length ?? 0;
  const todayHearingsCount =
    hearings?.filter((hearing) => dayjs(hearing.hearingDate).isSame(currentDate, 'day')).length ?? 0;

  useEffect(() => {
    if (selectedYear !== currentYear || selectedMonthIndex !== currentDate.month()) {
      return;
    }

    if (selectedMonthGroups.some((group) => group.dateKey === todayKey)) {
      setExpandedDayKeys((current) => ({ ...current, [todayKey]: true }));
    }
  }, [selectedMonthGroups, selectedMonthIndex, selectedYear]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleDay = (dateKey: string) => {
    setExpandedDayKeys((current) => ({
      ...current,
      [dateKey]: !current[dateKey],
    }));
  };

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
          <Link to="/hearings" className="flex items-center space-x-3 bg-legal-corporate p-3 rounded-lg text-white">
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

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Yearly Hearings</h3>
              <p className="text-3xl font-bold text-legal-corporate mt-2">{totalHearings}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Today&apos;s Hearings</h3>
              <p className="text-3xl font-bold text-legal-gold mt-2">{todayHearingsCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-gray-500 text-sm font-medium">Active Month</h3>
              <p className="text-xl font-bold text-gray-900 mt-2">{selectedMonth?.monthName} {selectedYear}</p>
              <p className="mt-2 text-sm text-gray-500">
                {selectedMonth?.hearingCount ?? 0} hearing{selectedMonth?.hearingCount === 1 ? '' : 's'} scheduled
              </p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
                <select
                  className="w-full border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                  value={selectedYear}
                  onChange={(e) => {
                    const nextYear = Number(e.target.value);
                    setSelectedYear(nextYear);
                    setSelectedMonthIndex(nextYear === currentYear ? currentDate.month() : 0);
                  }}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Case Search</label>
                <Search className="absolute left-3 top-10 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Case # or Client"
                  className="pl-10 w-full border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                  value={filters.caseSearch}
                  onChange={(e) => setFilters({ ...filters, caseSearch: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Case Status</label>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    className="flex-1 border-gray-200 rounded-xl p-2 bg-gray-50 focus:ring-2 focus:ring-legal-gold outline-none text-sm"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="0">Active Cases</option>
                    <option value="1">Closed Cases</option>
                  </select>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ caseSearch: '', status: '' });
                    setSelectedYear(currentYear);
                    setSelectedMonthIndex(currentDate.month());
                  }}
                  className="text-sm font-bold text-legal-corporate hover:text-legal-gold transition-colors w-full md:w-auto md:self-center"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-legal-corporate">Monthly Workload</h2>
                <p className="text-sm text-gray-500">Select a month to drill down into daily court activity.</p>
              </div>
              <div className="text-sm text-gray-500">Showing {selectedYear}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {monthlyGroups.map((month) => {
                const isSelected = selectedMonthIndex === month.monthIndex;
                const isEmpty = month.hearingCount === 0;

                return (
                  <button
                    key={month.monthIndex}
                    type="button"
                    onClick={() => setSelectedMonthIndex(month.monthIndex)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-legal-gold bg-amber-50 shadow-sm'
                        : isEmpty
                          ? 'border-dashed border-gray-200 bg-gray-50 hover:border-gray-300'
                          : 'border-gray-100 bg-white hover:border-legal-gold/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-legal-corporate">{month.monthName}</p>
                        <p className={`mt-1 text-xs ${isEmpty ? 'text-gray-400' : 'text-gray-500'}`}>
                          {isEmpty ? 'No hearings scheduled' : 'Pending hearings scheduled'}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-black ${
                        isEmpty ? 'bg-gray-100 text-gray-500' : 'bg-legal-gold/15 text-legal-corporate'
                      }`}>
                        {month.hearingCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-legal-corporate">Daily Drill-Down</h2>
                <p className="text-sm text-gray-500">
                  {selectedMonth?.monthName} {selectedYear} grouped into daily hearing bars.
                </p>
              </div>
              <div className="rounded-full bg-legal-gold/10 px-4 py-2 text-sm font-black text-legal-corporate">
                {selectedMonth?.hearingCount ?? 0} total
              </div>
            </div>

            {!isLoading && selectedMonthGroups.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">
                No hearings scheduled in {selectedMonth?.monthName} {selectedYear}.
              </div>
            )}

            <div className="space-y-4">
              {selectedMonthGroups.map((group) => {
                const isExpanded = Boolean(expandedDayKeys[group.dateKey]);

                return (
                  <div key={group.dateKey} className="overflow-hidden rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleDay(group.dateKey)}
                      className="flex w-full flex-col gap-3 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ChevronDown className={`h-5 w-5 shrink-0 text-legal-corporate transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        <div className="min-w-0">
                          <p className="text-base font-bold text-legal-corporate break-words">
                            {group.date.format('dddd, MMMM D, YYYY')}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {group.date.isSame(currentDate, 'day')
                              ? 'Today'
                              : `${group.hearings.length} scheduled appearance${group.hearings.length === 1 ? '' : 's'}`}
                          </p>
                        </div>
                      </div>
                      <span className="self-start rounded-full bg-legal-gold/15 px-4 py-1.5 text-sm font-black text-legal-corporate sm:self-auto">
                        {group.hearings.length}
                      </span>
                    </button>

                    <div className={`grid transition-all duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'}`}>
                      <div className="overflow-hidden">
                        <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6">
                          <div className="space-y-3">
                            {group.hearings.map((hearing) => (
                              <button
                                key={hearing.id}
                                type="button"
                                onClick={() => navigate(`/cases/${hearing.caseId}`)}
                                className="flex w-full flex-col gap-4 rounded-2xl border border-white bg-white p-4 text-left shadow-sm transition-colors hover:border-legal-gold/40 hover:bg-amber-50/30 sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-legal-corporate break-words">{hearing.clientName}</p>
                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                                      {dayjs(hearing.hearingDate).format('hh:mm A')}
                                    </span>
                                  </div>

                                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
                                    <div>
                                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Case Title</p>
                                      <p className="mt-1 break-words">{hearing.clientName}</p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">CNR</p>
                                      <p className="mt-1 break-words">{hearing.caseNumber}</p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Court Room</p>
                                      <p className="mt-1 flex items-start gap-2 break-words">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                                        <span>{hearing.location || 'To be updated'}</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Purpose</p>
                                      <p className="mt-1 break-words">{hearing.notes || 'Purpose not recorded yet'}</p>
                                    </div>
                                  </div>
                                </div>

                                <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-legal-corporate">
                                  Open Case
                                  <ArrowRight className="h-4 w-4" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Hearings;
