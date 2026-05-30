import { useEffect, useRef, useState } from 'react';
import { Upload, Cpu, MessageSquare } from 'lucide-react';

const steps = [
  { number: '01', icon: Upload, title: 'Connect your data', desc: 'Upload a CSV with your products, inventory, and suppliers. Everything is ingested automatically.', color: '#0071e3' },
  { number: '02', icon: Cpu, title: 'ML analyzes patterns', desc: 'Four trained models run simultaneously — forecasting, classifying, predicting, and detecting.', color: '#5856d6' },
  { number: '03', icon: MessageSquare, title: 'AI explains everything', desc: 'Ask questions in plain English. Get structured insights with severity levels and actions.', color: '#34c759' },
];

const HowItWorks = () => {
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
    <section id="how-it-works" ref={ref} className="py-[var(--space-section)] px-6 bg-[#f5f5f7] dark:bg-[#0a0a0a]">
      <div className="max-w-[980px] mx-auto">
        <div className="text-center mb-16">
          <h2 className={`text-[clamp(32px,5vw,52px)] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-white mb-3 text-balance transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            Three steps to clarity.
          </h2>
          <p className={`text-[16px] text-[#86868b] dark:text-[#a1a1a6] max-w-md mx-auto transition-all duration-700 ease-out delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            From raw data to actionable intelligence in minutes.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className={`hidden lg:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-transparent via-black/[0.08] dark:via-white/[0.08] to-transparent transition-all duration-1000 ${visible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`relative text-center transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${150 + i * 120}ms` }}
              >
                <div className="relative inline-flex items-center justify-center w-[72px] h-[72px] rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3)] mb-5">
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] text-[9px] font-bold">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white mb-2">{step.title}</h3>
                <p className="text-[14px] leading-[1.55] text-[#86868b] dark:text-[#a1a1a6] max-w-[280px] mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
