import { useEffect, useRef, useState } from 'react';

const stats = [
  {
    value: '4',
    suffix: '',
    unit: 'ML models',
    description: 'Pre-trained and ready. Demand forecasting, inventory risk, supplier delay, and cost anomaly detection.',
    color: '#0a84ff',
  },
  {
    value: '<1',
    suffix: 's',
    unit: 'prediction latency',
    description: 'Real-time inference on your data. Individual predictions return in under 100 milliseconds.',
    color: '#5e5ce6',
  },
  {
    value: '100',
    suffix: '%',
    unit: 'tenant isolation',
    description: 'Company-scoped data access enforced at every endpoint. No cross-tenant leaks. Ever.',
    color: '#30d158',
  },
  {
    value: '24',
    suffix: '/7',
    unit: 'AI availability',
    description: 'Always-on insights. The AI assistant and ML pipeline never sleep.',
    color: '#ff9f0a',
  },
];

const Stats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Performance.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light max-w-[500px] mx-auto transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Built for speed. Designed for scale.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <div
              key={stat.unit}
              className={`group relative p-8 md:p-10 rounded-[24px] border border-black/[0.08] dark:border-white/[0.06] bg-white dark:bg-[#1c1c1e] overflow-hidden transition-all duration-700 ease-out hover:border-black/[0.12] dark:hover:border-white/[0.1] ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${200 + i * 100}ms` }}
            >
              {/* Background glow */}
              <div
                className="absolute top-0 right-0 w-[300px] h-[300px] opacity-[0.08] transition-opacity duration-500 group-hover:opacity-[0.14]"
                style={{
                  background: `radial-gradient(circle at center, ${stat.color}, transparent 70%)`,
                }}
              />

              <div className="relative">
                {/* Big number */}
                <div className="mb-4">
                  <span
                    className="text-[clamp(56px,8vw,80px)] font-bold tracking-[-0.04em] leading-none transition-colors duration-500"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.03em] leading-none transition-colors duration-500"
                    style={{ color: `${stat.color}80` }}
                  >
                    {stat.suffix}
                  </span>
                </div>

                {/* Unit label */}
                <p className="text-[15px] font-semibold text-[#1d1d1f]/80 dark:text-white/70 tracking-[-0.01em] mb-3">
                  {stat.unit}
                </p>

                {/* Description */}
                <p className="text-[14px] leading-[1.6] text-[#86868b] dark:text-white/30 font-light max-w-[360px]">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
