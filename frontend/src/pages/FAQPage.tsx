import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { ChevronDown, Search } from 'lucide-react';

type FaqItem = { q: string; a: string };
type FaqCategory = { id: string; label: string; items: FaqItem[] };

const categories: FaqCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    items: [
      {
        q: 'What is ChainPilot?',
        a: 'ChainPilot is an ML-powered supply chain intelligence platform. It runs pre-trained models against your inventory, demand, supplier, and order data to forecast demand, classify risk, predict supplier delays, and detect cost anomalies — before they become problems.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Get Started" in the top nav, enter your email, company name, and industry. Your workspace is provisioned instantly with a separate tenant — no credit card required to evaluate.',
      },
      {
        q: 'How do I upload my data?',
        a: 'Go to the Upload page from the sidebar, drop a CSV with your products, inventory, suppliers, and orders. Our ingestion pipeline validates columns, normalizes units, and runs ML inference in the same request.',
      },
      {
        q: 'Is there a free tier?',
        a: 'Yes. You can sign up, upload a sample dataset, and explore every feature in the dashboard. The free tier is capped at a single workspace and a small monthly row limit.',
      },
    ],
  },
  {
    id: 'ml-and-ai',
    label: 'ML & AI',
    items: [
      {
        q: 'How does the ML pipeline work?',
        a: 'Four pre-trained models run inference on your data — no training required. Demand forecasting uses gradient boosting, inventory risk uses a classifier, supplier delay uses logistic regression, and cost anomaly uses Isolation Forest.',
      },
      {
        q: 'Do I need to train the ML models myself?',
        a: 'No. The models come pre-trained and are loaded at startup from .pkl files. The training pipeline is CLI-only and never runs at request time.',
      },
      {
        q: 'What AI model powers the natural language queries?',
        a: 'The platform uses GLM (via an OpenAI-compatible API) by default, but the provider is configurable via environment variables. The AI layer can be swapped without touching the rest of the codebase.',
      },
      {
        q: 'How fast are the predictions?',
        a: 'Individual predictions return in under 100ms. The batch analysis endpoint typically completes in 2-5 seconds depending on data volume.',
      },
      {
        q: 'Can I trust the model outputs?',
        a: 'Every prediction includes a confidence score and an explanation. The AI layer also annotates responses with severity levels and recommended actions so you always know what to do next.',
      },
    ],
  },
  {
    id: 'security',
    label: 'Security & Privacy',
    items: [
      {
        q: 'Is my data isolated from other companies?',
        a: 'Yes. Every API endpoint filters by company_id extracted from the JWT token. The company_isolation module enforces this structurally — it is impossible to query another tenant\'s data, even with a valid token from a different company.',
      },
      {
        q: 'How is my password stored?',
        a: 'Passwords are hashed with bcrypt before being written to the database. The plaintext is never logged, never stored, and never returned by any API.',
      },
      {
        q: 'Is the connection encrypted?',
        a: 'Yes. All traffic is served over HTTPS. The production stack includes an HTTPS redirect middleware so plain HTTP requests are automatically upgraded.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Data is stored in a managed PostgreSQL database with automated daily backups. Backups are encrypted at rest and retained for 30 days.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Data & Integrations',
    items: [
      {
        q: 'What format does my CSV need to be in?',
        a: 'The Upload page shows a live example and a downloadable template. The minimum columns are product name, category, unit price, current stock, and lead time. Optional columns unlock richer forecasts.',
      },
      {
        q: 'Can I edit data after uploading?',
        a: 'Yes. Inventory, supplier, and order records are editable from their respective pages. Deletions are soft — they can be restored from the audit log within 30 days.',
      },
      {
        q: 'Do you support real-time integrations with ERPs?',
        a: 'Not natively today. You can schedule a recurring CSV export from your ERP and drop it on the Upload page — most teams set this up with a 5-minute cron job.',
      },
      {
        q: 'Can I export my data?',
        a: 'Anytime. Every page has an Export button that downloads the current view as CSV. The Settings page also exposes a full workspace export.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account & Billing',
    items: [
      {
        q: 'How do I cancel my subscription?',
        a: 'Go to Settings → Plan → Cancel. Your workspace stays active until the end of the billing period, then downgrades to the free tier automatically. Your data is never deleted.',
      },
      {
        q: 'Can I change the company name on my account?',
        a: 'Yes. Update it in Settings → Profile. The change is reflected across the dashboard, exports, and the company_isolation key on the next request.',
      },
      {
        q: 'Do you offer team seats?',
        a: 'Yes. The Team plan includes 10 seats and role-based access. Larger plans are available on request — reach out via the link in the footer.',
      },
    ],
  },
];

const FAQPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0].id);
  const [openKey, setOpenKey] = useState<string | null>(`${categories[0].id}:0`);
  const [query, setQuery] = useState('');

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

  const filtered = categories
    .map((cat) => ({
      ...cat,
      items: query.trim()
        ? cat.items.filter(
            (i) =>
              i.q.toLowerCase().includes(query.toLowerCase()) ||
              i.a.toLowerCase().includes(query.toLowerCase())
          )
        : cat.items,
    }))
    .filter((cat) => cat.items.length > 0);

  const open = (id: string, idx: number) => {
    setActiveCategory(id);
    setOpenKey((prev) => (prev === `${id}:${idx}` ? null : `${id}:${idx}`));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-20 px-6 overflow-hidden bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.10)_0%,transparent_70%)]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative max-w-[900px] mx-auto text-center">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[11px] font-medium text-white/50 tracking-wide mb-8 transition-all duration-700 ease-out ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] animate-pulse" />
            Help Center
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-5 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            How can we{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              help?
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[520px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Answers to the questions our users ask most.
          </p>

          <div
            className={`mt-10 max-w-[480px] mx-auto transition-all duration-700 ease-out delay-300 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the help center…"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/[0.2] focus:bg-white/[0.06] transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ content */}
      <section className="px-6 pb-32">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
          {/* Category nav */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-semibold text-white/40 tracking-[0.05em] uppercase mb-4 px-1">
              Categories
            </p>
            <nav className="space-y-1">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`block px-4 py-2.5 rounded-xl text-[13px] font-light transition-all duration-300 ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }`}
                  >
                    {cat.label}
                  </a>
                );
              })}
            </nav>

            <div className="mt-10 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <p className="text-[13px] text-white/70 font-medium mb-1">
                Still need help?
              </p>
              <p className="text-[12px] text-white/40 font-light leading-[1.6] mb-3">
                We usually reply within a few hours.
              </p>
              <a
                href="mailto:adityabuilds@outlook.com?subject=ChainPilot%20Support"
                className="text-[12px] font-medium text-[#0a84ff] hover:text-[#5e9bff] transition-colors"
              >
                Contact support →
              </a>
            </div>
          </aside>

          {/* Accordion list */}
          <div className="space-y-16">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[15px] text-white/40 font-light">
                  No results for "{query}". Try a different keyword.
                </p>
              </div>
            ) : (
              filtered.map((cat) => (
                <div key={cat.id} id={cat.id} className="scroll-mt-24">
                  <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white mb-6">
                    {cat.label}
                  </h2>
                  <div className="space-y-2">
                    {cat.items.map((item, idx) => {
                      const isOpen = openKey === `${cat.id}:${idx}`;
                      return (
                        <div
                          key={`${cat.id}:${idx}`}
                          className={`rounded-[16px] border transition-all duration-300 ${
                            isOpen
                              ? 'border-white/[0.08] bg-white/[0.03]'
                              : 'border-transparent bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => open(cat.id, idx)}
                            className="w-full flex items-center justify-between px-6 py-5 text-left"
                          >
                            <span
                              className={`text-[15px] font-medium pr-4 transition-colors duration-300 ${
                                isOpen ? 'text-[#0a84ff]' : 'text-white/80'
                              }`}
                            >
                              {item.q}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                                isOpen
                                  ? 'rotate-180 text-[#0a84ff]'
                                  : 'text-white/20'
                              }`}
                            />
                          </button>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${
                              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}
                          >
                            <div className="px-6 pb-5">
                              <p className="text-[14px] leading-[1.7] text-white/40 font-light">
                                {item.a}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQPage;
