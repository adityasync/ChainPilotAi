import { useEffect, useRef, useState } from 'react';
import { Brain, Package, TrendingUp, Truck, Cpu, Shield } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Insights', desc: 'Natural language queries and auto-generated risk assessments in plain English.', color: '#0071e3' },
  { icon: Package, title: 'Inventory Management', desc: 'Real-time stock tracking with automatic risk classification across four levels.', color: '#34c759' },
  { icon: TrendingUp, title: 'Demand Forecasting', desc: 'Statistical models predict future demand with confidence intervals and accuracy tracking.', color: '#5856d6' },
  { icon: Truck, title: 'Supplier Intelligence', desc: 'Track reliability scores, shipment history, and ML-predicted delay probabilities.', color: '#ff9f0a' },
  { icon: Cpu, title: '4 ML Models', desc: 'Demand forecasting, inventory classification, delay prediction, and anomaly detection.', color: '#af52de' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Multi-tenant isolation, bcrypt hashing, JWT auth, and company-scoped data access.', color: '#ff3b30' },
];

const Features = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[980px] mx-auto">
        <div className="text-center mb-14">
          <h2 className={`text-[clamp(32px,5vw,52px)] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-white mb-3 text-balance transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Everything you need.
          </h2>
          <p className={`text-[16px] text-[#86868b] dark:text-[#a1a1a6] max-w-lg mx-auto transition-all duration-700 ease-out delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            A complete supply chain platform with machine learning at its core.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group p-6 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] transition-all duration-500 ease-out hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: `${100 + i * 60}ms` }}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${f.color}0D` }}>
                <f.icon className="w-[18px] h-[18px]" style={{ color: f.color }} />
              </div>
              <h3 className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white mb-1.5">{f.title}</h3>
              <p className="text-[14px] leading-[1.55] text-[#86868b] dark:text-[#a1a1a6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
