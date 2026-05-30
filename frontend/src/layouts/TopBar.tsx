import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

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

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            p-2 rounded-full
            text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white
            hover:bg-gray-100 dark:hover:bg-[#2c2c2e]
            transition-all duration-200
          "
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User info */}
        <div className="w-8 h-8 rounded-full bg-[#1d1d1f] dark:bg-white flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="
            p-2 rounded-full
            text-[#86868b] dark:text-[#98989d] hover:text-[#ff3b30]
            transition-colors duration-200
          "
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
