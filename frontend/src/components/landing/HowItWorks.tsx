import { useEffect, useRef, useState } from 'react';
import { Upload, Cpu, MessageSquare } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Connect your data',
    desc: 'Upload a CSV with your products, inventory, and suppliers. Everything is ingested automatically.',
    color: '#0a84ff',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'ML analyzes patterns',
    desc: 'Four trained models run simultaneously — forecasting, classifying, predicting, and detecting.',
    color: '#5e5ce6',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'AI explains everything',
    desc: 'Ask questions in plain English. Get structured insights with severity levels and actions.',
    color: '#30d158',
  },
];

const HowItWorks = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[1200px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-[#1d1d1f] dark:text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Three steps
            <br />
            to clarity.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-[#86868b] dark:text-white/40 font-light max-w-[500px] mx-auto transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            From raw data to actionable intelligence in minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className={`hidden lg:block absolute top-[60px] left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px transition-all duration-1000 ease-out bg-[linear-gradient(to_right,transparent,rgba(0,0,0,0.08),transparent)] dark:bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.08),transparent)] ${
              visible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`relative text-center transition-all duration-700 ease-out ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                {/* Step icon */}
                <div className="relative inline-flex items-center justify-center w-[80px] h-[80px] rounded-[20px] bg-[#f5f5f7] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.06] mb-6">
                  <step.icon className="w-8 h-8" style={{ color: step.color }} />
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{
                      backgroundColor: step.color,
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Step content */}
                <h3 className="text-[18px] font-semibold text-[#1d1d1f] dark:text-white mb-3 tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#86868b] dark:text-white/40 font-light max-w-[300px] mx-auto">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
