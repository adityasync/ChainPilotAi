import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
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
          ? 'bg-black/60 backdrop-blur-2xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img
            src="/favicon.png"
            alt="ChainPilot"
            className="w-7 h-7 rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="/#features"
            className="text-[12px] text-white/60 hover:text-white transition-colors duration-300"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            className="text-[12px] text-white/60 hover:text-white transition-colors duration-300"
          >
            How It Works
          </a>
          <a
            href="/#dashboard"
            className="text-[12px] text-white/60 hover:text-white transition-colors duration-300"
          >
            Dashboard
          </a>
          <Link
            to="/pricing"
            className="text-[12px] text-white/60 hover:text-white transition-colors duration-300"
          >
            Pricing
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-[12px] font-medium px-5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[12px] text-white/60 hover:text-white transition-colors duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-[12px] font-medium px-5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-all duration-300"
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
          className="md:hidden text-white p-1"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-2xl border-t border-white/[0.06] px-6 py-6 space-y-5">
          <a
            href="/#features"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-white/80 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-white/80 hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="/#dashboard"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-white/80 hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <Link
            to="/pricing"
            onClick={() => setMobileOpen(false)}
            className="block text-[15px] text-white/80 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block text-center text-[15px] font-medium px-5 py-2.5 rounded-full bg-white text-black"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-[15px] text-white/80"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block text-center text-[15px] font-medium px-5 py-2.5 rounded-full bg-white text-black"
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
