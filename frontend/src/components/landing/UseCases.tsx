import { useEffect, useRef, useState } from 'react';
import { ShoppingBag, Factory, Truck } from 'lucide-react';

const useCases = [
  { icon: ShoppingBag, industry: 'Retail & E-Commerce', quote: 'We cut stockout incidents by 60% in the first quarter. The demand forecasting alone justified the switch.', metric: '60%', metricLabel: 'fewer stockouts', color: '#0071e3' },
  { icon: Factory, industry: 'Manufacturing', quote: 'The supplier delay predictions let us reroute orders before disruptions hit our production line.', metric: '3.2x', metricLabel: 'faster response', color: '#34c759' },
  { icon: Truck, industry: 'Logistics & Distribution', quote: 'The AI insights surface exactly what needs attention. No more digging through spreadsheets.', metric: '12hrs', metricLabel: 'saved per week', color: '#ff9f0a' },
];

const UseCases = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#f5f5f7] dark:bg-[#0a0a0a]">
      <div className="max-w-[980px] mx-auto">
        <div className="text-center mb-14">
          <h2 className={`text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white mb-3 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Built for every supply chain.
          </h2>
          <p className={`text-[16px] text-[#86868b] dark:text-[#a1a1a6] max-w-md mx-auto transition-all duration-700 ease-out delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            From small retailers to global manufacturers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {useCases.map((uc, i) => (
            <div
              key={uc.industry}
              className={`group p-6 rounded-[16px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] transition-all duration-500 ease-out hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            >
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center mb-4" style={{ backgroundColor: `${uc.color}0D` }}>
                <uc.icon className="w-[18px] h-[18px]" style={{ color: uc.color }} />
              </div>
              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#86868b] dark:text-[#6e6e73] mb-3">
                {uc.industry}
              </p>
              <blockquote className="text-[14px] leading-[1.6] text-[#1d1d1f] dark:text-white/90 mb-5">
                &ldquo;{uc.quote}&rdquo;
              </blockquote>
              <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <p className="text-[28px] font-semibold tracking-[-0.02em]" style={{ color: uc.color }}>{uc.metric}</p>
                <p className="text-[12px] text-[#86868b] dark:text-[#6e6e73] mt-0.5">{uc.metricLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
