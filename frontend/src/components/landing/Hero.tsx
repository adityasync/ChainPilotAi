import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Package, ShieldCheck, AlertTriangle, Users } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-12 pb-20 bg-[#fbfbfd] dark:bg-black">
      {/* Subtle background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-950/20 dark:to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-purple-50/30 to-transparent dark:from-purple-950/10 dark:to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[980px] mx-auto px-6 text-center">
        {/* Eyebrow */}
        <p
          className="text-[#0071e3] dark:text-[#0a84ff] text-sm font-medium tracking-wide mb-6 opacity-0 animate-fade-in-up"
        >
          ML-Powered Supply Chain Intelligence
        </p>

        {/* Headline */}
        <h1
          className="text-[clamp(44px,8vw,80px)] font-semibold tracking-[-0.03em] leading-[1.05] text-[#1d1d1f] dark:text-white mb-6 text-balance opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          Supply chain
          <br />
          <span className="bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de] dark:from-[#0a84ff] dark:via-[#5e5ce6] dark:to-[#bf5af2] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_8s_ease_infinite]">
            intelligence, reimagined.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-[clamp(17px,2.2vw,21px)] leading-[1.5] text-[#86868b] dark:text-[#a1a1a6] max-w-[580px] mx-auto mb-10 text-balance opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          Predict demand, classify inventory risk, detect supplier delays, and flag cost anomalies — before they become problems.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0071e3] dark:bg-[#0a84ff] text-white text-[15px] font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a8aff] transition-all duration-200 active:scale-[0.97]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#f5f5f7] dark:bg-white/10 text-[#1d1d1f] dark:text-white text-[15px] font-medium hover:bg-[#e8e8ed] dark:hover:bg-white/15 transition-all duration-200"
          >
            See how it works
          </a>
        </div>

        {/* Dashboard mock */}
        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="relative rounded-[20px] overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_-15px_rgba(0,0,0,0.5)]">
            <div className="relative bg-[#1c1c1e] p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#38383a] rounded-md px-4 py-1 text-[11px] text-[#98989d]">
                    dashboard.flowchain.app
                  </div>
                </div>
                <div className="w-12" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { icon: Package, label: 'Products', value: '142', color: '#0071e3' },
                  { icon: ShieldCheck, label: 'Health', value: '78%', color: '#34c759' },
                  { icon: AlertTriangle, label: 'Risks', value: '7', color: '#ff9f0a' },
                  { icon: Users, label: 'Suppliers', value: '3', color: '#ff3b30' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[#2c2c2e] rounded-xl p-3.5 border border-[#38383a]/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                      <span className="text-[10px] text-[#98989d]">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-semibold text-white">{kpi.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-14 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <a href="#features" className="inline-flex flex-col items-center gap-1 text-[#86868b] dark:text-[#6e6e73] hover:text-[#1d1d1f] dark:hover:text-white transition-colors duration-300">
            <span className="text-[11px] font-medium tracking-wide uppercase">Explore</span>
            <ChevronDown className="w-4 h-4 animate-[float_2s_ease-in-out_infinite]" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
