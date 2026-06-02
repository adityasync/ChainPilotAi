import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { Shield } from 'lucide-react';

type Section = { id: string; title: string };

const sections: Section[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information We Collect' },
  { id: 'how-we-use', title: 'How We Use Information' },
  { id: 'multi-tenant-isolation', title: 'Multi-Tenant Data Isolation' },
  { id: 'ml-model-handling', title: 'ML Model Handling' },
  { id: 'data-storage', title: 'Data Storage and Security' },
  { id: 'your-rights', title: 'Your Rights' },
  { id: 'cookies', title: 'Cookies and Tracking' },
  { id: 'third-party', title: 'Third-Party Services' },
  { id: 'children', title: "Children's Privacy" },
  { id: 'changes', title: 'Changes to this Policy' },
  { id: 'contact', title: 'Contact' },
];

const PrivacyPage = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [active, setActive] = useState<string>(sections[0].id);
  const lastUpdated = 'June 2, 2026';

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

  useEffect(() => {
    const headings = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (headings.length === 0) return;

    const onScroll = () => {
      const offset = 160;
      let current = headings[0].id;
      for (const h of headings) {
        const top = h.getBoundingClientRect().top;
        if (top - offset <= 0) current = h.id;
        else break;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-16 px-6 overflow-hidden bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(94,92,230,0.10)_0%,transparent_70%)]" />
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
            <Shield className="w-3 h-3" />
            Privacy Policy
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-5 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Your data,{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              your terms.
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[520px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Plain English. No legalese walls of text.
          </p>
          <p
            className={`mt-6 text-[12px] text-white/30 font-light transition-all duration-700 ease-out delay-300 ${
              heroVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Last updated · {lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-32">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12">
          {/* TOC */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-semibold text-white/40 tracking-[0.05em] uppercase mb-4 px-1">
              On this page
            </p>
            <nav className="space-y-1">
              {sections.map((s) => {
                const isActive = active === s.id;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block px-4 py-2 rounded-lg text-[12px] font-light transition-all duration-300 leading-[1.5] ${
                      isActive
                        ? 'bg-white/[0.06] text-white'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }`}
                  >
                    {s.title}
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Document */}
          <article className="max-w-[680px]">
            <Section id="introduction" title="1. Introduction">
              <p>
                ChainPilot ("we", "us", or "our") operates an ML-powered
                supply chain intelligence platform. This Privacy Policy
                explains how we collect, use, store, and protect information
                when you use chainpilot.app and related services (the
                "Service").
              </p>
              <p>
                By creating an account or using the Service, you agree to
                the practices described below. If anything is unclear, email
                us — we will read every message.
              </p>
            </Section>

            <Section id="information-we-collect" title="2. Information We Collect">
              <p>We collect three categories of information:</p>
              <ul>
                <li>
                  <strong className="text-white/80 font-medium">
                    Account information
                  </strong>{' '}
                  — your email address, company name, industry, and password
                  (stored as a bcrypt hash).
                </li>
                <li>
                  <strong className="text-white/80 font-medium">
                    Operational data
                  </strong>{' '}
                  — the supply chain data you upload: products, inventory,
                  suppliers, orders, and any optional context you provide.
                </li>
                <li>
                  <strong className="text-white/80 font-medium">
                    Usage telemetry
                  </strong>{' '}
                  — request logs, IP addresses, and aggregated feature usage
                  used to keep the Service healthy and detect abuse.
                </li>
              </ul>
            </Section>

            <Section id="how-we-use" title="3. How We Use Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Authenticate you and isolate your workspace.</li>
                <li>Run ML inference and AI explanations against your data.</li>
                <li>
                  Deliver the core product (dashboards, alerts, exports).
                </li>
                <li>Send you critical service emails (security, billing).</li>
                <li>
                  Investigate abuse, debug issues, and improve reliability.
                </li>
              </ul>
              <p>
                We do not sell your data. We do not share your operational
                data with other tenants or third parties for advertising.
              </p>
            </Section>

            <Section id="multi-tenant-isolation" title="4. Multi-Tenant Data Isolation">
              <p>
                Every ChainPilot workspace is a fully isolated tenant. All
                API endpoints filter records by a{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[13px] text-white/80 font-mono">
                  company_id
                </code>{' '}
                extracted from your JWT — enforced structurally by our
                company_isolation module. It is impossible to query another
                tenant's data, even with a valid token from a different
                company.
              </p>
            </Section>

            <Section id="ml-model-handling" title="5. ML Model Handling">
              <p>
                Our forecasting, classification, and anomaly models are
                pre-trained and loaded at startup from{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[13px] text-white/80 font-mono">
                  .pkl
                </code>{' '}
                files. We never train on your data, we never export your
                data to train external models, and we never use your
                operational data as input to third-party ML providers.
              </p>
              <p>
                The natural-language assistant can optionally call a
                configurable LLM (default: GLM via an OpenAI-compatible
                API). When it does, only the user-submitted question and
                the minimal structured context needed to answer it are
                sent. You can disable the AI layer entirely from Settings.
              </p>
            </Section>

            <Section id="data-storage" title="6. Data Storage and Security">
              <p>
                Data is stored in a managed PostgreSQL database with
                automated daily backups encrypted at rest and retained for
                30 days. All traffic is served over HTTPS — the production
                stack includes an HTTPS redirect middleware that
                automatically upgrades plain HTTP requests.
              </p>
              <p>
                Passwords are hashed with bcrypt. Tokens are short-lived
                JWTs with rotation. Access keys for cloud providers are
                scoped to the minimum permissions required.
              </p>
              <p>
                No system is perfectly secure. If we ever discover a
                material breach affecting your data, we will notify you
                within 72 hours.
              </p>
            </Section>

            <Section id="your-rights" title="7. Your Rights">
              <p>You can, at any time:</p>
              <ul>
                <li>Access the personal data we hold about you.</li>
                <li>Correct inaccurate information from the Settings page.</li>
                <li>
                  Export a full copy of your workspace data (Settings →
                  Export).
                </li>
                <li>
                  Delete your account and all associated data by emailing
                  us from your registered address.
                </li>
                <li>
                  Withdraw consent for optional processing (e.g. AI
                  assistant) without affecting core Service availability.
                </li>
              </ul>
            </Section>

            <Section id="cookies" title="8. Cookies and Tracking">
              <p>
                ChainPilot uses a small set of strictly necessary cookies
                for authentication and theme preference. We do not use
                third-party advertising cookies, and we do not run
                cross-site tracking scripts.
              </p>
            </Section>

            <Section id="third-party" title="9. Third-Party Services">
              <p>
                We rely on a small set of subprocessors to operate the
                Service: a managed PostgreSQL provider for storage, an
                authentication email service for verification, and an
                optional LLM provider for the AI assistant. A current list
                of subprocessors is available on request.
              </p>
            </Section>

            <Section id="children" title="10. Children's Privacy">
              <p>
                The Service is not directed at children under 16, and we do
                not knowingly collect personal information from children.
                If you believe a child has created an account, contact us
                and we will delete it.
              </p>
            </Section>

            <Section id="changes" title="11. Changes to this Policy">
              <p>
                We may update this Privacy Policy as the Service evolves.
                Material changes will be announced by email and reflected in
                the "Last updated" date at the top of this page. Continued
                use of the Service after a change indicates acceptance of
                the updated policy.
              </p>
            </Section>

            <Section id="contact" title="12. Contact">
              <p>
                Questions, concerns, or data requests? Email{' '}
                <a
                  href="mailto:adityabuilds@outlook.com?subject=ChainPilot%20Privacy%20Request"
                  className="text-[#0a84ff] hover:text-[#5e9bff] transition-colors"
                >
                  adityabuilds@outlook.com
                </a>
                . We read every message and typically respond within two
                business days.
              </p>
            </Section>

            <div className="mt-16 pt-8 border-t border-white/[0.06] text-[12px] text-white/30 font-light">
              &copy; {new Date().getFullYear()} ChainPilot. All rights
              reserved.
            </div>
          </article>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const Section = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24 mb-12">
    <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white mb-4">
      {title}
    </h2>
    <div className="space-y-4 text-[15px] leading-[1.75] text-white/55 font-light [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul>li]:marker:text-white/20 [&_a]:text-[#0a84ff] [&_a]:hover:text-[#5e9bff] [&_a]:transition-colors [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:text-[13px] [&_code]:text-white/80 [&_code]:font-mono [&_strong]:text-white/80 [&_strong]:font-medium">
      {children}
    </div>
  </section>
);

export default PrivacyPage;
