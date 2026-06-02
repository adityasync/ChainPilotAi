import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/20 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10 pointer-events-none" />

      {/* Content */}
      <div className="w-full max-w-md animate-fade-in-up relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0071e3]/20 to-purple-500/10 rounded-3xl blur-2xl scale-110" />
            <img
              src="/logo-login.png"
              alt="ChainPilot logo"
              className="relative w-40 h-40 rounded-3xl object-cover invert dark:invert-0 drop-shadow-lg"
            />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-semibold text-center text-[#1d1d1f] dark:text-white tracking-tight mb-2">
          Sign in.
        </h1>
        <p className="text-center text-[#86868b] dark:text-[#98989d] text-lg mb-10">
          Welcome back to ChainPilot
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-shake">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label
              htmlFor="email"
              className={`absolute left-5 transition-all duration-200 pointer-events-none ${
                focusedField === 'email' || email
                  ? 'top-1.5 text-xs text-[#0071e3] dark:text-blue-400 font-medium'
                  : 'top-1/2 -translate-y-1/2 text-lg text-[#aeaeb2]'
              }`}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className="
                w-full px-5 py-4 pt-6 text-lg
                bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl
                text-[#1d1d1f] dark:text-white
                focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10
                transition-all duration-200
              "
            />
          </div>

          <div className="relative">
            <label
              htmlFor="password"
              className={`absolute left-5 transition-all duration-200 pointer-events-none ${
                focusedField === 'password' || password
                  ? 'top-1.5 text-xs text-[#0071e3] dark:text-blue-400 font-medium'
                  : 'top-1/2 -translate-y-1/2 text-lg text-[#aeaeb2]'
              }`}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className="
                w-full px-5 py-4 pt-6 pr-14 text-lg
                bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#38383a] rounded-xl
                text-[#1d1d1f] dark:text-white
                focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10
                transition-all duration-200
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-white transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-4 text-lg font-medium
              bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-full
              hover:bg-black dark:hover:bg-gray-200 hover:shadow-lg
              active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-10 text-center text-[#86868b] dark:text-[#98989d]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#0071e3] dark:text-blue-400 hover:underline font-medium"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Copyright */}
      <p className="absolute bottom-8 text-sm text-[#86868b] dark:text-[#98989d]">
        &copy; {new Date().getFullYear()} ChainPilot. All rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;