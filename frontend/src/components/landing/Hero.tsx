import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#fbfbfd] dark:bg-black">
      {/* Ambient gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.18)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.12)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(175,82,222,0.12)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(175,82,222,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(52,199,89,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(52,199,89,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Grid overlay for depth (dark only) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] hidden dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="relative z-10 max-w-[1000px] mx-auto px-6 text-center pt-24 pb-32">
        {/* Eyebrow */}
        <div className="hero-reveal" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.03] text-[11px] font-medium text-[#1d1d1f]/70 dark:text-white/50 tracking-wide mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
            ML-Powered Supply Chain Intelligence
          </span>
        </div>

        {/* Main headline */}
        <h1
          className="hero-reveal text-[clamp(52px,10vw,96px)] font-bold tracking-[-0.04em] leading-[0.95] text-[#1d1d1f] dark:text-white mb-6"
          style={{ animationDelay: '0.2s' }}
        >
          Supply chain
          <br />
          <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_8s_ease_infinite]">
            intelligence.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-reveal text-[clamp(17px,2.5vw,24px)] leading-[1.4] text-[#86868b] dark:text-white/40 max-w-[600px] mx-auto mb-12 font-light"
          style={{ animationDelay: '0.35s' }}
        >
          Predict demand. Classify risk. Detect anomalies.
          <br className="hidden sm:block" />
          Before they become problems.
        </p>

        {/* CTAs */}
        <div
          className="hero-reveal flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          style={{ animationDelay: '0.5s' }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black text-[15px] font-medium hover:bg-[#1d1d1f]/90 dark:hover:bg-white/90 transition-all duration-300 active:scale-[0.97]"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="/#features"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-black/[0.12] dark:border-white/[0.12] bg-white/80 dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white text-[15px] font-medium hover:bg-white dark:hover:bg-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2] transition-all duration-300"
          >
            Explore features
          </a>
        </div>

        {/* Dashboard preview card */}
        <div
          className="hero-reveal relative mx-auto max-w-[860px]"
          style={{ animationDelay: '0.65s' }}
        >
          {/* Glow behind the card */}
          <div className="absolute inset-0 -inset-x-8 -inset-y-4 bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.18)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.15)_0%,transparent_60%)] blur-2xl" />

          <div className="relative rounded-[20px] overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] shadow-[0_0_80px_-20px_rgba(10,132,255,0.18)] dark:shadow-[0_0_80px_-20px_rgba(10,132,255,0.2)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#f5f5f7] dark:bg-[#111] border-b border-black/[0.06] dark:border-white/[0.04]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white dark:bg-[#2c2c2e] rounded-md px-4 py-1 text-[11px] text-[#86868b] font-medium">
                  dashboard.chainpilot.app
                </div>
              </div>
              <div className="w-12" />
            </div>

            {/* Dashboard content */}
            <div className="p-4 md:p-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Products', value: '142', change: '+12%', color: '#0a84ff' },
                  { label: 'Health Score', value: '78%', change: '+5%', color: '#30d158' },
                  { label: 'Active Risks', value: '7', change: '-3', color: '#ff9f0a' },
                  { label: 'Suppliers', value: '3', change: 'at risk', color: '#ff453a' },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-black/[0.04] dark:border-white/[0.04]"
                  >
                    <p className="text-[10px] text-[#86868b] dark:text-white/40 mb-1">{kpi.label}</p>
                    <p className="text-[22px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.02em]">
                      {kpi.value}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: kpi.color }}>
                      {kpi.change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Demand chart placeholder */}
                <div className="md:col-span-2 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-medium text-[#1d1d1f]/80 dark:text-white/70">Demand Trend</p>
                    <p className="text-[10px] text-[#0a84ff]">6 months</p>
                  </div>
                  <div className="h-24 flex items-end gap-1.5">
                    {[40, 55, 48, 62, 70, 85].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, rgba(10,132,255,0.3), rgba(10,132,255,0.05))`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Inventory breakdown */}
                <div className="bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl p-4 border border-black/[0.04] dark:border-white/[0.04]">
                  <p className="text-[11px] font-medium text-[#1d1d1f]/80 dark:text-white/70 mb-3">Inventory</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Healthy', value: 75, color: '#30d158' },
                      { label: 'Low Stock', value: 15, color: '#ff9f0a' },
                      { label: 'Critical', value: 10, color: '#ff453a' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-[#86868b] dark:text-white/40">{item.label}</span>
                          <span className="text-[10px] text-[#1d1d1f]/70 dark:text-white/60">{item.value}%</span>
                        </div>
                        <div className="h-1.5 bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${item.value}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="hero-reveal mt-16"
          style={{ animationDelay: '0.9s' }}
        >
          <a
            href="/#features"
            className="inline-flex flex-col items-center gap-1.5 text-[#86868b] hover:text-[#1d1d1f] dark:text-white/20 dark:hover:text-white/40 transition-colors duration-500"
          >
            <span className="text-[10px] font-medium tracking-[0.15em] uppercase">
              Scroll to explore
            </span>
            <ChevronDown className="w-4 h-4 animate-[float_2.5s_ease-in-out_infinite]" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
