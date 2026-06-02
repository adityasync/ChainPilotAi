import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-black/[0.06] dark:border-white/[0.04] bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/favicon.png"
                alt="ChainPilot"
                className="w-7 h-7 rounded-lg object-cover invert dark:invert-0"
              />
              <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">ChainPilot</span>
            </div>
            <p className="text-[13px] text-[#86868b] dark:text-white/30 leading-relaxed max-w-[240px] font-light">
              ML-powered supply chain intelligence. Predict, classify, detect — before
              problems escalate.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#86868b] dark:text-white/50 tracking-[0.05em] uppercase mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="/#features"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/#dashboard"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#86868b] dark:text-white/50 tracking-[0.05em] uppercase mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#86868b] dark:text-white/50 tracking-[0.05em] uppercase mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/faq"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#86868b] dark:text-white/50 tracking-[0.05em] uppercase mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[13px] text-[#86868b] dark:text-white/30 hover:text-[#1d1d1f] dark:hover:text-white/60 transition-colors duration-300 font-light"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-black/[0.06] dark:border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[12px] text-[#86868b] dark:text-white/20 font-light">
            &copy; {new Date().getFullYear()} ChainPilot. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-[12px] text-[#86868b] dark:text-white/20 hover:text-[#1d1d1f] dark:hover:text-white/40 transition-colors duration-300 font-light"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-[12px] text-[#86868b] dark:text-white/20 hover:text-[#1d1d1f] dark:hover:text-white/40 transition-colors duration-300 font-light"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
