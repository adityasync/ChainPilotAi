import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

type Tier = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  ctaTo: string;
  highlighted?: boolean;
  features: string[];
};

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to evaluate ChainPilot on a real dataset.',
    cta: 'Get started',
    ctaTo: '/register',
    features: [
      '1 workspace',
      'Up to 500 rows / month',
      'Demand forecasting & risk classification',
      'Inventory & supplier dashboards',
      'AI assistant (50 queries / month)',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: 'per month',
    description: 'For growing teams that run supply chain ops every day.',
    cta: 'Start free trial',
    ctaTo: '/register',
    highlighted: true,
    features: [
      'Everything in Free',
      'Up to 50,000 rows / month',
      'Cost anomaly detection',
      'Unlimited AI assistant queries',
      'CSV & scheduled exports',
      'Priority email support',
      '99.9% uptime SLA',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 'Custom',
    period: 'contact us',
    description: 'For multi-warehouse operations and larger supply chains.',
    cta: 'Contact sales',
    ctaTo: '/contact',
    features: [
      'Everything in Pro',
      'Unlimited rows',
      'Up to 10 team seats with RBAC',
      'Custom ML model retraining',
      'Dedicated success manager',
      'Single sign-on (SSO)',
      'Custom data residency',
    ],
  },
];

type FeatureRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
};

const comparison: FeatureRow[] = [
  { label: 'Workspaces', free: '1', pro: '1', team: 'Unlimited' },
  { label: 'Monthly data rows', free: '500', pro: '50,000', team: 'Unlimited' },
  { label: 'Demand forecasting', free: true, pro: true, team: true },
  { label: 'Inventory risk classification', free: true, pro: true, team: true },
  { label: 'Supplier delay prediction', free: true, pro: true, team: true },
  { label: 'Cost anomaly detection', free: false, pro: true, team: true },
  { label: 'AI assistant queries', free: '50 / mo', pro: 'Unlimited', team: 'Unlimited' },
  { label: 'CSV export', free: true, pro: true, team: true },
  { label: 'Scheduled exports', free: false, pro: true, team: true },
  { label: 'Team seats', free: '1', pro: '3', team: '10' },
  { label: 'Role-based access control', free: false, pro: false, team: true },
  { label: 'Custom ML retraining', free: false, pro: false, team: true },
  { label: 'SSO / SAML', free: false, pro: false, team: true },
  { label: 'Support', free: 'Community', pro: 'Priority email', team: 'Dedicated CSM' },
  { label: 'Uptime SLA', free: '—', pro: '99.9%', team: '99.99%' },
];

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrade or downgrade anytime from Settings → Plan. Changes are pro-rated and your data is preserved.',
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes. Annual billing on Pro is $39 / seat / month — a 20% saving. Contact us for Team annual pricing.',
  },
  {
    q: 'What happens if I exceed my row limit?',
    a: 'We never silently drop your data. New uploads beyond the limit queue until the next billing cycle, and we email you well before you hit the cap.',
  },
  {
    q: 'Is there a startup or education discount?',
    a: 'Yes. Reach out via the Contact page with a short note about your use case and we will get back within 48 hours.',
  },
];

const PricingPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
        className="relative pt-40 pb-16 px-6 overflow-hidden bg-[#fbfbfd] dark:bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.12)_0%,transparent_70%)]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] hidden dark:block"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-[900px] mx-auto text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.03] text-[11px] font-medium text-[#1d1d1f]/60 dark:text-white/50 tracking-wide mb-8 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            Pricing
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-5 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Simple pricing.{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              Serious intelligence.
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light max-w-[520px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Start free. Upgrade when your supply chain grows. No surprises.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="px-6 pb-24">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <div
              key={tier.id}
              className={`relative rounded-[24px] p-8 flex flex-col transition-all duration-500 ${
                tier.highlighted
                  ? 'bg-white dark:bg-white/[0.04] border border-[#0a84ff]/30 shadow-[0_0_60px_-20px_rgba(10,132,255,0.4)]'
                  : 'bg-white dark:bg-white/[0.02] border border-black/[0.08] dark:border-white/[0.06] hover:bg-[#f5f5f7] dark:hover:bg-white/[0.03]'
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0a84ff] text-white text-[10px] font-semibold tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-[14px] font-semibold text-[#86868b] dark:text-white/60 tracking-[0.05em] uppercase mb-3">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-[44px] font-bold text-[#1d1d1f] dark:text-white tracking-[-0.03em]">
                    {tier.price}
                  </span>
                  <span className="text-[14px] text-[#86868b] dark:text-white/40 font-light">
                    {tier.period}
                  </span>
                </div>
                <p className="text-[13px] text-[#1d1d1f]/70 dark:text-white/40 font-light leading-[1.6] min-h-[3.2em]">
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#30d158] flex-shrink-0 mt-0.5" />
                    <span className="text-[13px] text-[#1d1d1f] dark:text-white/70 font-light leading-[1.5]">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to={tier.ctaTo}
                className={`inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full text-[14px] font-medium transition-all duration-300 ${
                  tier.highlighted
                    ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white/90 active:scale-[0.97]'
                    : 'border border-black/[0.12] dark:border-white/[0.12] bg-black/[0.04] dark:bg-white/[0.04] text-[#1d1d1f] dark:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/[0.2] dark:hover:border-white/[0.2]'
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="px-6 pb-24">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-2 text-center">
            Compare plans
          </h2>
          <p className="text-[15px] text-[#86868b] dark:text-white/40 font-light text-center mb-12">
            Every plan includes the full ML pipeline and AI assistant.
          </p>

          {/* Mobile note: the tier cards above already list every feature,
              so the side-by-side comparison is hidden on small screens to
              avoid a wrapping grid that misaligns labels with values. */}
          <div className="hidden md:block rounded-2xl border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#f5f5f7] dark:bg-white/[0.02]">
              <div className="text-[11px] font-semibold text-[#86868b] dark:text-white/40 tracking-[0.05em] uppercase">
                Feature
              </div>
              <div className="text-[12px] font-semibold text-[#1d1d1f] dark:text-white/60 text-center">Free</div>
              <div className="text-[12px] font-semibold text-[#0a84ff] text-center">Pro</div>
              <div className="text-[12px] font-semibold text-[#1d1d1f] dark:text-white/60 text-center">Team</div>
            </div>

            {comparison.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 px-6 py-4 ${
                  i < comparison.length - 1 ? 'border-b border-black/[0.04] dark:border-white/[0.04]' : ''
                }`}
              >
                <div className="text-[13px] text-[#1d1d1f] dark:text-white/70 font-light">{row.label}</div>
                <Cell value={row.free} />
                <Cell value={row.pro} highlight />
                <Cell value={row.team} />
              </div>
            ))}
          </div>

          {/* Mobile fallback — "see the tier cards above" hint */}
          <p className="md:hidden text-center text-[13px] text-[#86868b] dark:text-white/30 font-light">
            Tap a plan above to see its full feature list.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-32">
        <div className="max-w-[680px] mx-auto">
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-2 text-center">
            Pricing questions
          </h2>
          <p className="text-[15px] text-[#86868b] dark:text-white/40 font-light text-center mb-10">
            Quick answers to what teams ask us most.
          </p>

          <div className="space-y-2">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`rounded-[16px] border transition-all duration-300 ${
                    isOpen
                      ? 'border-black/[0.10] dark:border-white/[0.08] bg-white dark:bg-white/[0.03]'
                      : 'border-transparent bg-[#f5f5f7] dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <span
                      className={`text-[15px] font-medium pr-4 transition-colors duration-300 ${
                        isOpen ? 'text-[#0a84ff]' : 'text-[#1d1d1f] dark:text-white/80'
                      }`}
                    >
                      {f.q}
                    </span>
                    <span
                      className={`text-[12px] flex-shrink-0 transition-all duration-300 ${
                        isOpen ? 'rotate-45 text-[#0a84ff]' : 'text-[#86868b] dark:text-white/30'
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-5">
                      <p className="text-[14px] leading-[1.7] text-[#1d1d1f]/70 dark:text-white/40 font-light">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Cell = ({
  value,
  highlight,
}: {
  value: string | boolean;
  highlight?: boolean;
}) => {
  if (typeof value === 'boolean') {
    return (
      <div className="flex justify-center md:justify-center">
        {value ? (
          <Check className={`w-4 h-4 ${highlight ? 'text-[#0a84ff]' : 'text-[#30d158]'}`} />
        ) : (
          <span className="text-[14px] text-[#86868b] dark:text-white/20">—</span>
        )}
      </div>
    );
  }
  return (
    <div
      className={`text-center text-[13px] font-light ${
        highlight ? 'text-[#1d1d1f] dark:text-white' : 'text-[#1d1d1f]/70 dark:text-white/60'
      }`}
    >
      {value}
    </div>
  );
};

export default PricingPage;
