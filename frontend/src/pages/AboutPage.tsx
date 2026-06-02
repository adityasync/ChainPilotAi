import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Compass, Shield, Sparkles, Users } from 'lucide-react';

const values = [
  {
    icon: Sparkles,
    color: '#0a84ff',
    title: 'Intelligence first',
    desc: 'No dashboards full of vanity metrics. Every number on the screen should change a decision you would otherwise get wrong.',
  },
  {
    icon: Shield,
    color: '#30d158',
    title: 'Your data is yours',
    desc: 'Multi-tenant isolation is enforced at the data layer, not by convention. We never train on your data, and we never share it.',
  },
  {
    icon: Compass,
    color: '#5e5ce6',
    title: 'Built for operators',
    desc: 'Designed by people who have lived through stockouts, line stops, and emergency supplier calls. The product reflects that.',
  },
  {
    icon: Users,
    color: '#ff9f0a',
    title: 'Plain by default',
    desc: 'No jargon walls. No "AI magic". Every prediction is explained in plain English, with a confidence score and a next step.',
  },
];

const stats = [
  { value: '4', label: 'ML models running in parallel' },
  { value: '<100ms', label: 'Median prediction latency' },
  { value: '100%', label: 'Tenant data isolation' },
  { value: '0', label: 'Models trained on your data' },
];

const AboutPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeroVisible(true);
      },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-white">
      <Navbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-20 px-6 overflow-hidden bg-[#fbfbfd] dark:bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(94,92,230,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(94,92,230,0.10)_0%,transparent_70%)]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] hidden dark:block"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-[860px] mx-auto text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-[11px] font-medium text-[#1d1d1f]/60 dark:text-white/50 tracking-wide mb-8 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            About
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-6 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Why we built{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              ChainPilot.
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light max-w-[620px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Most supply chain software tells you what already happened.
            ChainPilot tells you what is about to happen — and what to do
            about it.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-6 pb-24">
        <div className="max-w-[760px] mx-auto">
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-10 md:p-14">
            <p className="text-[12px] font-semibold text-[#0a84ff] tracking-[0.1em] uppercase mb-4">
              Our mission
            </p>
            <p className="text-[clamp(20px,2.5vw,26px)] leading-[1.5] text-[#1d1d1f] dark:text-white/85 font-light tracking-[-0.01em]">
              Give every supply chain team — from a two-person startup to
              a 50-person operations org — the same caliber of forecasting,
              risk classification, and anomaly detection that the Fortune
              100 spend millions building in-house.
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-[#1d1d1f]/70 dark:text-white/50 font-light">
              We started ChainPilot after watching too many teams make
              six-figure decisions on gut feel and a stale spreadsheet.
              The models existed. The data existed. What was missing was
              a product that put them on the same desk.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-24">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-6 text-center"
            >
              <p className="text-[clamp(32px,4vw,44px)] font-bold tracking-[-0.03em] text-[#1d1d1f] dark:text-white mb-1">
                {s.value}
              </p>
              <p className="text-[12px] text-[#86868b] dark:text-white/40 font-light leading-[1.4]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="px-6 pb-24">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[clamp(32px,5vw,48px)] font-bold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-3">
              What we believe
            </h2>
            <p className="text-[16px] text-[#86868b] dark:text-white/40 font-light max-w-[480px] mx-auto">
              Four principles that shape every feature we ship.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-8 hover:bg-[#f5f5f7] dark:hover:bg-white/[0.03] transition-colors duration-300"
              >
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-5"
                  style={{
                    backgroundColor: `${v.color}15`,
                    border: `1px solid ${v.color}30`,
                  }}
                >
                  <v.icon className="w-5 h-5" style={{ color: v.color }} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white mb-2 tracking-[-0.01em]">
                  {v.title}
                </h3>
                <p className="text-[14px] leading-[1.6] text-[#1d1d1f]/70 dark:text-white/50 font-light">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-6 pb-24">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-[24px] border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-10 md:p-14">
            <p className="text-[12px] font-semibold text-[#30d158] tracking-[0.1em] uppercase mb-4">
              Who it is for
            </p>
            <h2 className="text-[clamp(24px,3.5vw,36px)] font-bold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-6 leading-[1.2]">
              Teams that run real supply chains and need answers today.
            </h2>
            <ul className="space-y-3 text-[15px] leading-[1.7] text-[#1d1d1f]/70 dark:text-white/60 font-light">
              <li className="flex gap-3">
                <span className="text-[#86868b] dark:text-white/30 mt-1">→</span>
                <span>
                  Operations leads juggling 5+ suppliers and 100+ SKUs
                  across multiple warehouses.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#86868b] dark:text-white/30 mt-1">→</span>
                <span>
                  Finance teams trying to spot cost anomalies before they
                  show up in the monthly close.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#86868b] dark:text-white/30 mt-1">→</span>
                <span>
                  Founders who cannot afford to hire a full data team but
                  still need demand forecasts that work.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#86868b] dark:text-white/30 mt-1">→</span>
                <span>
                  Consultants running supply chain audits for clients who
                  want fast, defensible insights.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-32">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-[clamp(32px,5vw,48px)] font-bold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-4 leading-[1.15]">
            Ready to see it on your data?
          </h2>
          <p className="text-[16px] text-[#86868b] dark:text-white/40 font-light mb-8 max-w-[460px] mx-auto">
            Spin up a workspace in 30 seconds. No credit card. No
            commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white/90 transition-all duration-300 active:scale-[0.97]"
            >
              Get started free
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-black/[0.12] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white text-[15px] font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2] transition-all duration-300"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
