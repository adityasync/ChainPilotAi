import { useEffect, useRef, useState } from 'react';
import { Brain, TrendingUp, Package, Truck, Cpu, Shield } from 'lucide-react';

const highlights = [
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    subtitle: 'Ask anything. Get answers.',
    description:
      'Natural language queries powered by LLM. Ask about stock levels, supplier risks, or demand trends in plain English — the AI reads your data and responds with structured insights.',
    color: '#0a84ff',
    gradient: 'from-[#0a84ff]/20 to-[#5e5ce6]/10',
  },
  {
    icon: TrendingUp,
    title: 'Demand Forecasting',
    subtitle: 'Predict what\'s next.',
    description:
      'Statistical models analyze historical patterns to predict future demand with confidence intervals. Track accuracy and adjust forecasts as new data arrives.',
    color: '#5e5ce6',
    gradient: 'from-[#5e5ce6]/20 to-[#bf5af2]/10',
  },
  {
    icon: Package,
    title: 'Inventory Intelligence',
    subtitle: 'See risk at a glance.',
    description:
      'Every inventory item is automatically classified by risk level. Dashboards show exactly what needs attention — from stockout emergencies to overstock waste.',
    color: '#30d158',
    gradient: 'from-[#30d158]/20 to-[#0a84ff]/10',
  },
  {
    icon: Truck,
    title: 'Supplier Intelligence',
    subtitle: 'Know before they delay.',
    description:
      'Track reliability scores, shipment history, and ML-predicted delay probabilities. Get early warnings when suppliers start slipping.',
    color: '#ff9f0a',
    gradient: 'from-[#ff9f0a]/20 to-[#ff453a]/10',
  },
  {
    icon: Cpu,
    title: '4 ML Models',
    subtitle: 'Pre-trained. Ready.',
    description:
      'Demand forecasting, inventory classification, supplier delay prediction, and cost anomaly detection — all running simultaneously on your data.',
    color: '#bf5af2',
    gradient: 'from-[#bf5af2]/20 to-[#ff453a]/10',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    subtitle: 'Isolated by design.',
    description:
      'Multi-tenant isolation, bcrypt hashing, JWT authentication, and company-scoped data access. Every endpoint enforces boundaries structurally.',
    color: '#ff453a',
    gradient: 'from-[#ff453a]/20 to-[#ff9f0a]/10',
  },
];

const FeatureHighlights = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate highlights
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [visible]);

  const active = highlights[activeIndex];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-[var(--space-section)] px-6 bg-black"
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Highlights.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[500px] mx-auto transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Everything you need to run a smarter supply chain.
          </p>
        </div>

        {/* Tab navigation */}
        <div
          className={`flex flex-wrap justify-center gap-2 mb-12 transition-all duration-700 ease-out delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {highlights.map((h, i) => (
            <button
              key={h.title}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-white text-black'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] hover:text-white/70'
              }`}
            >
              <h.icon className="w-3.5 h-3.5" />
              {h.title}
            </button>
          ))}
        </div>

        {/* Active highlight card */}
        <div
          className={`transition-all duration-700 ease-out delay-300 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative rounded-[24px] overflow-hidden border border-white/[0.06] bg-[#1c1c1e]">
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${active.gradient} transition-all duration-700`}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16">
              {/* Text content */}
              <div className="flex flex-col justify-center">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] font-medium tracking-wide mb-6 w-fit"
                  style={{ color: active.color }}
                >
                  <active.icon className="w-3 h-3" />
                  {active.title}
                </div>

                <h3 className="text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-4">
                  {active.subtitle}
                </h3>

                <p className="text-[17px] leading-[1.6] text-white/50 font-light max-w-[440px]">
                  {active.description}
                </p>

                <div className="mt-8">
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 text-[14px] font-medium hover:gap-3 transition-all duration-300"
                    style={{ color: active.color }}
                  >
                    Learn more
                    <span className="text-lg">→</span>
                  </a>
                </div>
              </div>

              {/* Visual side - animated abstract representation */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[400px] aspect-square">
                  {/* Central icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-24 h-24 rounded-[24px] flex items-center justify-center transition-all duration-700"
                      style={{
                        backgroundColor: `${active.color}15`,
                        border: `1px solid ${active.color}30`,
                      }}
                    >
                      <active.icon
                        className="w-10 h-10 transition-colors duration-700"
                        style={{ color: active.color }}
                      />
                    </div>
                  </div>

                  {/* Orbiting dots */}
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 rounded-full transition-all duration-700"
                      style={{
                        backgroundColor: `${active.color}40`,
                        top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6 + activeIndex * 0.5)}%`,
                        left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6 + activeIndex * 0.5)}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}

                  {/* Concentric rings */}
                  {[1, 2, 3].map((ring) => (
                    <div
                      key={ring}
                      className="absolute inset-0 m-auto rounded-full border transition-all duration-700"
                      style={{
                        width: `${ring * 28}%`,
                        height: `${ring * 28}%`,
                        borderColor: `${active.color}${ring === 1 ? '12' : ring === 2 ? '08' : '04'}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid below */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
          {highlights.map((h, i) => (
            <button
              key={h.title}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`group p-4 rounded-[16px] border transition-all duration-500 text-left ${
                i === activeIndex
                  ? 'bg-white/[0.06] border-white/[0.1]'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
              } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${400 + i * 60}ms` }}
            >
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-3 transition-all duration-300"
                style={{
                  backgroundColor: `${h.color}${i === activeIndex ? '20' : '10'}`,
                }}
              >
                <h.icon
                  className="w-4 h-4 transition-colors duration-300"
                  style={{ color: h.color }}
                />
              </div>
              <p
                className={`text-[12px] font-semibold mb-1 transition-colors duration-300 ${
                  i === activeIndex ? 'text-white' : 'text-white/60'
                }`}
              >
                {h.title}
              </p>
              <p className="text-[11px] text-white/30 leading-relaxed">{h.subtitle}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;
