import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import { FileText } from 'lucide-react';

type Section = { id: string; title: string };

const sections: Section[] = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'eligibility', title: 'Eligibility and Accounts' },
  { id: 'license', title: 'License and Acceptable Use' },
  { id: 'ml-output', title: 'ML Output and AI Disclaimer' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'subscription', title: 'Subscriptions and Billing' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'indemnification', title: 'Indemnification' },
  { id: 'governing-law', title: 'Governing Law' },
  { id: 'changes', title: 'Changes to these Terms' },
  { id: 'contact', title: 'Contact' },
];

const TermsPage = () => {
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
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-white">
      <Navbar />

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-16 px-6 overflow-hidden bg-[#fbfbfd] dark:bg-black"
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(48,209,88,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(48,209,88,0.10)_0%,transparent_70%)]" />
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
            <FileText className="w-3 h-3" />
            Terms of Service
          </span>
          <h1
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-5 transition-all duration-700 ease-out delay-100 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            The rules of{' '}
            <span className="bg-gradient-to-r from-[#0a84ff] via-[#5e5ce6] to-[#bf5af2] bg-clip-text text-transparent">
              the road.
            </span>
          </h1>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light max-w-[520px] mx-auto transition-all duration-700 ease-out delay-200 ${
              heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Fair, transparent, and written for humans.
          </p>
          <p
            className={`mt-6 text-[12px] text-[#86868b] dark:text-white/30 font-light transition-all duration-700 ease-out delay-300 ${
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
            <p className="text-[11px] font-semibold text-[#86868b] dark:text-white/40 tracking-[0.05em] uppercase mb-4 px-1">
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
                        ? 'bg-black/[0.06] dark:bg-white/[0.06] text-[#1d1d1f] dark:text-white'
                        : 'text-[#86868b] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white/70 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
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
            <Section id="acceptance" title="1. Acceptance of Terms">
              <p>
                These Terms of Service ("Terms") govern your access to and
                use of ChainPilot. By creating an account, clicking "I
                agree", or using the Service, you accept these Terms and
                our Privacy Policy. If you do not agree, do not use the
                Service.
              </p>
            </Section>

            <Section id="eligibility" title="2. Eligibility and Accounts">
              <p>
                You must be at least 16 years old and authorized to bind
                the company you represent to use ChainPilot on its behalf.
              </p>
              <p>
                You are responsible for maintaining the security of your
                account credentials and for everything that happens under
                your account. Notify us immediately at{' '}
                <a
                  href="mailto:adityabuilds@outlook.com?subject=ChainPilot%20Security%20Report"
                >
                  adityabuilds@outlook.com
                </a>{' '}
                if you suspect unauthorized access.
              </p>
            </Section>

            <Section id="license" title="3. License and Acceptable Use">
              <p>
                Subject to your compliance with these Terms and timely
                payment of fees, we grant you a non-exclusive,
                non-transferable, revocable license to access and use the
                Service for your internal business operations.
              </p>
              <p>You agree not to:</p>
              <ul>
                <li>
                  Reverse engineer, decompile, or attempt to extract the
                  source code of the Service.
                </li>
                <li>
                  Resell, sublicense, or white-label the Service without
                  our written consent.
                </li>
                <li>
                  Upload data you do not have the legal right to process,
                  or use the Service to violate any applicable law.
                </li>
                <li>
                  Attempt to bypass rate limits, multi-tenant isolation, or
                  any other security control.
                </li>
                <li>
                  Use the Service to train competing ML models or
                  benchmark them against ours.
                </li>
              </ul>
            </Section>

            <Section id="ml-output" title="4. ML Output and AI Disclaimer">
              <p>
                ChainPilot surfaces forecasts, classifications, and
                anomaly scores generated by pre-trained machine learning
                models, and may surface explanations from a configurable
                large language model. These outputs are{' '}
                <strong>
                  decision-support
                </strong>
                , not autonomous decisions. You remain solely responsible
                for any business action you take (or refrain from taking)
                based on the Service.
              </p>
              <p>
                We work hard to keep our models accurate, but we make no
                warranty that any specific prediction, recommendation, or
                alert is correct for your situation. Always validate
                high-stakes decisions against your domain knowledge.
              </p>
            </Section>

            <Section id="intellectual-property" title="5. Intellectual Property">
              <p>
                The Service, including its design, code, models, brand, and
                documentation, is owned by ChainPilot and protected by
                intellectual property laws. You retain all rights to the
                data you upload — we only use it to operate the Service
                for you.
              </p>
              <p>
                Feedback you provide may be used by us to improve the
                Service without obligation to you.
              </p>
            </Section>

            <Section id="subscription" title="6. Subscriptions and Billing">
              <p>
                Paid plans are billed in advance on a recurring basis
                (monthly or annually). Fees are non-refundable except where
                required by law. We may change pricing with at least 30
                days notice; continued use after the change takes effect
                constitutes acceptance.
              </p>
              <p>
                If a payment fails, we may suspend the Service after a
                reasonable grace period. Your data is preserved for at
                least 60 days after suspension.
              </p>
            </Section>

            <Section id="termination" title="7. Termination">
              <p>
                You may cancel at any time from Settings → Plan. We may
                suspend or terminate the Service immediately if you breach
                these Terms, fail to pay fees, or pose a security risk to
                the Service or other tenants.
              </p>
              <p>
                On termination, your right to use the Service ends. We
                will delete or return your data within 30 days unless
                retention is required by law.
              </p>
            </Section>

            <Section id="liability" title="8. Limitation of Liability">
              <p>
                To the maximum extent permitted by law, ChainPilot's total
                cumulative liability arising out of or relating to the
                Service will not exceed the greater of (a) the fees you
                paid to us in the 12 months preceding the claim or (b)
                USD $100.
              </p>
              <p>
                In no event will ChainPilot be liable for indirect,
                incidental, consequential, special, exemplary, or
                punitive damages, including lost profits, lost revenue,
                or lost data, even if advised of the possibility of such
                damages.
              </p>
            </Section>

            <Section id="indemnification" title="9. Indemnification">
              <p>
                You agree to indemnify and hold ChainPilot harmless from
                any third-party claim arising out of (a) your use of the
                Service in violation of these Terms, (b) data you upload,
                or (c) your violation of any applicable law.
              </p>
            </Section>

            <Section id="governing-law" title="10. Governing Law">
              <p>
                These Terms are governed by the laws of the jurisdiction
                in which ChainPilot is incorporated, without regard to
                conflict-of-laws principles. Any dispute will be resolved
                exclusively in the competent courts of that jurisdiction.
              </p>
            </Section>

            <Section id="changes" title="11. Changes to these Terms">
              <p>
                We may update these Terms as the Service evolves.
                Material changes will be announced by email and reflected
                in the "Last updated" date at the top of this page. If you
                continue to use the Service after the effective date of a
                change, you accept the updated Terms.
              </p>
            </Section>

            <Section id="contact" title="12. Contact">
              <p>
                Questions about these Terms? Email{' '}
                <a
                  href="mailto:adityabuilds@outlook.com?subject=ChainPilot%20Legal%20Question"
                >
                  adityabuilds@outlook.com
                </a>
                .
              </p>
            </Section>

            <div className="mt-16 pt-8 border-t border-black/[0.08] dark:border-white/[0.06] text-[12px] text-[#86868b] dark:text-white/30 font-light">
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
    <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-4">
      {title}
    </h2>
    <div className="space-y-4 text-[15px] leading-[1.75] text-[#1d1d1f]/70 dark:text-white/55 font-light [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul>li]:marker:text-[#1d1d1f]/30 [&_ul>li]:dark:marker:text-white/20 [&_a]:text-[#0a84ff] [&_a]:hover:text-[#5e9bff] [&_a]:transition-colors [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-black/[0.06] [&_code]:dark:bg-white/[0.06] [&_code]:text-[13px] [&_code]:text-[#1d1d1f]/80 [&_code]:dark:text-white/80 [&_code]:font-mono [&_strong]:text-[#1d1d1f] [&_strong]:dark:text-white/80 [&_strong]:font-medium">
      {children}
    </div>
  </section>
);

export default TermsPage;
