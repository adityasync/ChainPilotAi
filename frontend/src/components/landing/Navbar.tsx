import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Moon, Sun, X } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 dark:bg-black/60 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img
            src="/favicon.png"
            alt="ChainPilot"
            className="w-7 h-7 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105 invert dark:invert-0"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/#features"
            className="text-[12px] text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            className="text-[12px] text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300"
          >
            How It Works
          </a>
          <a
            href="/#dashboard"
            className="text-[12px] text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300"
          >
            Dashboard
          </a>
          <Link
            to="/pricing"
            className="text-[12px] text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300"
          >
            Pricing
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-[12px] font-medium px-5 py-1.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white/90 transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[12px] text-[#1d1d1f]/60 dark:text-white/60 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-[12px] font-medium px-5 py-1.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white/90 transition-all duration-300"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-[#1d1d1f] dark:text-white p-1"
          aria-label="Open menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/95 dark:bg-black/90 backdrop-blur-2xl border-t border-black/[0.06] dark:border-white/[0.06] px-6 py-6 space-y-5">
          <a
            href="/#features"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-[#1d1d1f]/80 dark:text-white/80 hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-[#1d1d1f]/80 dark:text-white/80 hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="/#dashboard"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-[#1d1d1f]/80 dark:text-white/80 hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <Link
            to="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-[#1d1d1f]/80 dark:text-white/80 hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 text-[15px] text-[#1d1d1f]/80 dark:text-white/80 hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block text-center text-[15px] font-medium px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-[15px] text-[#1d1d1f]/80 dark:text-white/80"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-[15px] font-medium px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
