import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-10 px-6 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/favicon.png" alt="FlowChain" className="w-6 h-6 rounded-md object-cover invert dark:invert-0" />
              <span className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white">FlowChain</span>
            </div>
            <p className="text-[13px] text-[#86868b] dark:text-[#6e6e73] leading-relaxed max-w-[240px]">
              ML-powered supply chain intelligence.
            </p>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-[#1d1d1f] dark:text-white mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-[13px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-[13px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">How It Works</a></li>
              <li><Link to="/register" className="text-[13px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-[#1d1d1f] dark:text-white mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-[13px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Sign In</Link></li>
              <li><span className="text-[13px] text-[#86868b] dark:text-[#6e6e73]">FAQ</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-[#1d1d1f] dark:text-white mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-[13px] text-[#86868b] dark:text-[#6e6e73]">Privacy</span></li>
              <li><span className="text-[13px] text-[#86868b] dark:text-[#6e6e73]">Terms</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[12px] text-[#86868b] dark:text-[#6e6e73]">
            &copy; {new Date().getFullYear()} FlowChain. All rights reserved.
          </span>
          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[12px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="text-[12px] text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
