import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-14 flex items-center justify-end gap-4 px-8">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="
          p-2 rounded-full
          text-[#86868b] hover:text-[#1d1d1f]
          hover:bg-gray-100
          transition-all duration-200
        "
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1d1d1f] flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="
          p-2 rounded-full
          text-[#86868b] hover:text-[#ff3b30]
          transition-colors duration-200
        "
        title="Sign out"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
};

export default TopBar;