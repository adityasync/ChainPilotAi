import { useState, useRef, useEffect } from 'react';
import { LogOut, Moon, Sun, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <header className="h-14 flex items-center justify-between lg:justify-end gap-4 px-4 sm:px-8">
      {/* Brand - visible only on mobile (where sidebar is hidden) */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <img
          src="/favicon.png"
          alt="ChainPilot"
          className="w-7 h-7 rounded-lg object-cover invert dark:invert-0"
        />
        <span className="text-base font-semibold text-[#1d1d1f] dark:text-white">
          ChainPilot
        </span>
      </div>

      {/* Profile menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-8 h-8 rounded-full bg-[#1d1d1f] dark:bg-[#3a3a3c] flex items-center justify-center hover:ring-2 hover:ring-gray-200 dark:hover:ring-[#48484a] transition-all"
          title="Account"
        >
          <span className="text-white dark:text-white/90 text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-lg border border-gray-100 dark:border-[#38383a] py-1 z-50">
            {/* User email */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#38383a]">
              <p className="text-sm font-medium text-[#1d1d1f] dark:text-white truncate">
                {user?.email || 'User'}
              </p>
            </div>

            {/* Settings */}
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>

            {/* Theme toggle */}
            <button
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-[#38383a] my-1" />

            {/* Logout */}
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#ff3b30] hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
