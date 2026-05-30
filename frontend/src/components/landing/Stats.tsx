import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: '4', suffix: '', label: 'ML Models', desc: 'Pre-trained and ready', color: '#0071e3' },
  { value: '< 1', suffix: 's', label: 'Prediction Latency', desc: 'Real-time inference', color: '#5856d6' },
  { value: '100', suffix: '%', label: 'Tenant Isolation', desc: 'Company-scoped data', color: '#34c759' },
  { value: '24', suffix: '/7', label: 'AI Availability', desc: 'Always-on insights', color: '#ff9f0a' },
];

const Stats = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center p-6 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <p className="text-[clamp(32px,4vw,48px)] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-white">
                {stat.value}
                <span style={{ color: stat.color }}>{stat.suffix}</span>
              </p>
              <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-white mt-1">{stat.label}</p>
              <p className="text-[12px] text-[#86868b] dark:text-[#6e6e73] mt-0.5">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
