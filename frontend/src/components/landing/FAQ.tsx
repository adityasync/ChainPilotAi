import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'How does the ML pipeline work?', a: 'Four pre-trained models run inference on your data — no training required. Demand forecasting uses gradient boosting, inventory risk uses a classifier, supplier delay uses logistic regression, and cost anomaly uses Isolation Forest.' },
  { q: 'Is my data isolated from other companies?', a: "Yes. Every API endpoint filters by company_id extracted from the JWT token. The company_isolation module enforces this structurally — it's impossible to query another tenant's data." },
  { q: 'What AI model powers the natural language queries?', a: 'The platform uses GLM (via an OpenAI-compatible API) by default, but the provider is configurable via environment variables. The AI layer can be swapped without touching the rest of the codebase.' },
  { q: 'Do I need to train the ML models myself?', a: 'No. The models come pre-trained and are loaded at startup from .pkl files. The training pipeline is CLI-only and never runs at request time.' },
  { q: 'How fast are the predictions?', a: 'Individual predictions return in under 100ms. The batch analysis endpoint typically completes in 2-5 seconds depending on data volume.' },
  { q: 'Can I deploy this to production?', a: 'The stack is production-ready: FastAPI with async/await, PostgreSQL with Alembic migrations, bcrypt hashing, JWT auth, CORS configuration, and HTTPS redirect middleware.' },
];

const FAQ = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[640px] mx-auto">
        <div className="text-center mb-12">
          <h2 className={`text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Questions & Answers
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-[12px] border transition-all duration-300 ${isOpen ? 'border-black/[0.06] dark:border-white/[0.1] bg-white dark:bg-[#1c1c1e]' : 'border-transparent bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
                style={{ transitionDelay: `${80 + i * 50}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className={`text-[14px] font-medium pr-4 transition-colors duration-200 ${isOpen ? 'text-[#0071e3] dark:text-[#0a84ff]' : 'text-[#1d1d1f] dark:text-white'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#0071e3] dark:text-[#0a84ff]' : 'text-[#86868b] dark:text-[#6e6e73]'}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="px-5 pb-4">
                    <p className="text-[14px] leading-[1.6] text-[#86868b] dark:text-[#a1a1a6]">{faq.a}</p>
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
