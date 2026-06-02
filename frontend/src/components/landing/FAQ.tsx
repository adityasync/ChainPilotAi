import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'How does the ML pipeline work?',
    a: 'Four pre-trained models run inference on your data — no training required. Demand forecasting uses gradient boosting, inventory risk uses a classifier, supplier delay uses logistic regression, and cost anomaly uses Isolation Forest.',
  },
  {
    q: 'Is my data isolated from other companies?',
    a: "Yes. Every API endpoint filters by company_id extracted from the JWT token. The company_isolation module enforces this structurally — it's impossible to query another tenant's data.",
  },
  {
    q: 'What AI model powers the natural language queries?',
    a: 'The platform uses GLM (via an OpenAI-compatible API) by default, but the provider is configurable via environment variables. The AI layer can be swapped without touching the rest of the codebase.',
  },
  {
    q: 'Do I need to train the ML models myself?',
    a: 'No. The models come pre-trained and are loaded at startup from .pkl files. The training pipeline is CLI-only and never runs at request time.',
  },
  {
    q: 'How fast are the predictions?',
    a: 'Individual predictions return in under 100ms. The batch analysis endpoint typically completes in 2-5 seconds depending on data volume.',
  },
  {
    q: 'Can I deploy this to production?',
    a: 'The stack is production-ready: FastAPI with async/await, PostgreSQL with Alembic migrations, bcrypt hashing, JWT auth, CORS configuration, and HTTPS redirect middleware.',
  },
];

const FAQ = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[720px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Questions.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Everything you need to know.
          </p>
        </div>

        {/* FAQ items */}
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-[16px] border transition-all duration-300 ${
                  isOpen
                    ? 'border-black/[0.08] bg-white dark:border-white/[0.08] dark:bg-white/[0.03]'
                    : 'border-transparent bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-white/[0.02] dark:hover:bg-white/[0.04]'
                } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${100 + i * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span
                    className={`text-[15px] font-medium pr-4 transition-colors duration-300 ${
                      isOpen ? 'text-[#0a84ff]' : 'text-[#1d1d1f] dark:text-white/80'
                    }`}
                  >
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'rotate-180 text-[#0a84ff]'
                        : 'text-[#86868b] dark:text-white/20'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5">
                    <p className="text-[14px] leading-[1.7] text-[#86868b] dark:text-white/40 font-light">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
