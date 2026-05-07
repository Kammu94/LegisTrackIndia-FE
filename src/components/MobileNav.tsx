import { useEffect, useId, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Calendar, Inbox, LayoutDashboard, LogOut, Menu, Scale, User, X } from 'lucide-react';

type MobileNavProps = {
  onLogout: () => void;
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases', label: 'My Cases', icon: Briefcase },
  { to: '/hearings', label: 'Hearings', icon: Calendar },
  { to: '/leads', label: 'Leads', icon: Inbox },
  { to: '/profile', label: 'Profile', icon: User },
];

const MobileNav = ({ onLogout }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const drawerId = useId();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-legal-corporate hover:bg-gray-100 transition-colors"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls={drawerId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />

          <aside
            id={drawerId}
            className="relative h-full w-72 max-w-[85vw] bg-legal-dark text-white shadow-2xl flex flex-col"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Scale className="h-8 w-8 text-legal-gold shrink-0" />
                <span className="text-xl font-bold tracking-tight">LegisTrack</span>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close navigation menu"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => {
                const isActive =
                  to === '/cases'
                    ? location.pathname === '/cases' || location.pathname.startsWith('/cases/')
                    : to === '/leads'
                      ? location.pathname === '/leads' || location.pathname.startsWith('/leads/')
                    : to === '/profile'
                      ? location.pathname === '/profile'
                    : location.pathname === to;

                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                      isActive
                        ? 'bg-legal-corporate text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={closeMenu}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg p-3 text-red-400 hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default MobileNav;
