import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Check, Moon, Sun } from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-xl text-[#86868b]">
          Manage your preferences
        </p>
      </div>

      {/* Account Section */}
      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-4">
          Account
        </h2>
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-[#1d1d1f]">Email</p>
              <p className="text-[#86868b]">{user?.email || 'Not available'}</p>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <button
            onClick={logout}
            className="text-[#ff3b30] font-medium hover:underline"
          >
            Sign out
          </button>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-4">
          Appearance
        </h2>
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {isDark ? (
                <Moon className="w-5 h-5 text-[#86868b]" />
              ) : (
                <Sun className="w-5 h-5 text-[#86868b]" />
              )}
              <div>
                <p className="font-medium text-[#1d1d1f]">Dark mode</p>
                <p className="text-sm text-[#86868b]">
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative w-14 h-8 rounded-full
                transition-all duration-300
                ${isDark ? 'bg-[#34c759]' : 'bg-gray-200'}
              `}
            >
              <span
                className={`
                  absolute top-1 w-6 h-6 rounded-full bg-white shadow-md
                  flex items-center justify-center
                  transition-all duration-300
                  ${isDark ? 'left-7' : 'left-1'}
                `}
              >
                {isDark ? (
                  <Check className="w-3 h-3 text-[#34c759]" />
                ) : null}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-4">
          About
        </h2>
        <div className="bg-white rounded-2xl p-6 space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-[#86868b]">Version</span>
            <span className="text-[#1d1d1f] font-medium">1.0.0</span>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex justify-between py-2">
            <span className="text-[#86868b]">Build</span>
            <span className="text-[#1d1d1f] font-medium">2024.02.01</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;