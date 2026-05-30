import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-black/[0.04] dark:border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="FlowChain" className="w-7 h-7 rounded-md object-cover invert dark:invert-0" />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <a href="#features" className="text-xs text-[#1d1d1f]/70 dark:text-white/70 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-200">
            Features
          </a>
          <a href="#how-it-works" className="text-xs text-[#1d1d1f]/70 dark:text-white/70 hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-200">
            How It Works
          </a>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-xs font-medium px-4 py-1.5 rounded-full bg-[#0071e3] dark:bg-[#0a84ff] text-white hover:bg-[#0077ed] dark:hover:bg-[#0a8aff] transition-all duration-200"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs text-[#1d1d1f] dark:text-white hover:text-[#0071e3] dark:hover:text-[#0a84ff] transition-colors duration-200">
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium px-4 py-1.5 rounded-full bg-[#0071e3] dark:bg-[#0a84ff] text-white hover:bg-[#0077ed] dark:hover:bg-[#0a8aff] transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[#1d1d1f] dark:text-white p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border-t border-black/[0.04] dark:border-white/[0.06] px-6 py-5 space-y-4">
          <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1d1d1f] dark:text-white">Features</a>
          <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm text-[#1d1d1f] dark:text-white">How It Works</a>
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-center text-sm font-medium px-5 py-2.5 rounded-full bg-[#0071e3] text-white">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-center text-sm text-[#1d1d1f] dark:text-white">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block text-center text-sm font-medium px-5 py-2.5 rounded-full bg-[#0071e3] text-white">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
