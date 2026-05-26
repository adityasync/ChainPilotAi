import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
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
    <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center px-6">
      {/* Content */}
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-semibold text-center text-[#1d1d1f] tracking-tight mb-2">
          Sign in.
        </h1>
        <p className="text-center text-[#86868b] text-lg mb-10">
          Welcome back to Supply
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full px-5 py-4 text-lg
                bg-white border border-gray-200 rounded-xl
                text-[#1d1d1f] placeholder-[#aeaeb2]
                focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10
                transition-all duration-200
              "
              placeholder="Email"
            />
          </div>

          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-5 py-4 text-lg
                bg-white border border-gray-200 rounded-xl
                text-[#1d1d1f] placeholder-[#aeaeb2]
                focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10
                transition-all duration-200
              "
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-4 text-lg font-medium
              bg-[#1d1d1f] text-white rounded-full
              hover:bg-black
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
        <p className="mt-10 text-center text-[#86868b]">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#0071e3] hover:underline font-medium"
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Copyright */}
      <p className="absolute bottom-8 text-sm text-[#86868b]">
        © 2024 Supply. All rights reserved.
      </p>
    </div>
  );
};

export default LoginPage;