import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Check, Moon, Sun } from 'lucide-react';
import { settingsAPI } from '../services/apiService';

const SettingsPage = () => {
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await settingsAPI.getUserProfile();
        const profile = response.data;
        setEmail(profile.email || '');
        setCompanyName(profile.company_name || '');
        setIndustry(profile.industry || '');
      } catch (fetchError) {
        console.error('Failed to load profile:', fetchError);
        setError('Unable to load account settings.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await settingsAPI.updateProfile({
        company_name: companyName,
        industry,
      });
      await refreshUser();
      setMessage('Profile updated.');
    } catch (saveError) {
      console.error('Failed to update profile:', saveError);
      setError('Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl">
      <div className="mb-12">
        <h1 className="text-5xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-xl text-[#86868b] dark:text-[#98989d]">
          Manage your preferences
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl bg-[#f1fff4] dark:bg-emerald-900/20 px-5 py-4 text-sm text-[#137333] dark:text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-[#fff4f4] dark:bg-red-900/20 px-5 py-4 text-sm text-[#b42318] dark:text-red-400">
          {error}
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-4">
          Account
        </h2>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 space-y-5">
          <ProfileField label="Email" value={email} onChange={setEmail} disabled />
          <ProfileField label="Company" value={companyName} onChange={setCompanyName} />
          <ProfileField label="Industry" value={industry} onChange={setIndustry} />
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="
                px-6 py-3 rounded-full text-sm font-medium
                bg-[#1d1d1f] text-white hover:bg-black dark:bg-white dark:text-[#1d1d1f] dark:hover:bg-gray-200 transition-all duration-200 disabled:opacity-60
              "
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={logout}
              className="text-[#ff3b30] dark:text-red-400 font-medium hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-4">
          Appearance
        </h2>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {isDark ? (
                <Moon className="w-5 h-5 text-[#86868b] dark:text-[#98989d]" />
              ) : (
                <Sun className="w-5 h-5 text-[#86868b] dark:text-[#98989d]" />
              )}
              <div>
                <p className="font-medium text-[#1d1d1f] dark:text-white">Dark mode</p>
                <p className="text-sm text-[#86868b] dark:text-[#98989d]">
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                relative w-14 h-8 rounded-full
                transition-all duration-300
                ${isDark ? 'bg-[#34c759]' : 'bg-gray-200 dark:bg-[#38383a]'}
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

      <section className="mb-12">
        <h2 className="text-sm font-medium text-[#86868b] dark:text-[#98989d] uppercase tracking-wider mb-4">
          About
        </h2>
        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-6 space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-[#86868b] dark:text-[#98989d]">Version</span>
            <span className="text-[#1d1d1f] dark:text-white font-medium">1.0.0</span>
          </div>
          <div className="border-t border-gray-100 dark:border-[#38383a]" />
          <div className="flex justify-between py-2">
            <span className="text-[#86868b] dark:text-[#98989d]">Account</span>
            <span className="text-[#1d1d1f] dark:text-white font-medium">{user?.email || email}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

interface ProfileFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ProfileField = ({ label, value, onChange, disabled = false }: ProfileFieldProps) => (
  <label className="block">
    <span className="block text-sm font-medium text-[#86868b] dark:text-[#98989d] mb-2">{label}</span>
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="
        w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#38383a] bg-white dark:bg-[#1c1c1e]
        text-[#1d1d1f] dark:text-white focus:outline-none focus:border-[#0071e3] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#0071e3]/10 dark:focus:ring-blue-400/10 disabled:bg-[#f5f5f7] dark:disabled:bg-[#2c2c2e] disabled:text-[#86868b] dark:disabled:text-[#98989d]
      "
    />
  </label>
);

export default SettingsPage;
