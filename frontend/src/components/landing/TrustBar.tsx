import { useEffect, useRef, useState } from 'react';

const counters = [
  { value: 10000, suffix: '+', label: 'Products tracked' },
  { value: 4, suffix: '', label: 'ML models' },
  { value: 99, suffix: '%', label: 'Uptime' },
  { value: 50, suffix: 'ms', label: 'Avg response' },
];

const TrustBar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="py-10 px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[980px] mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-0">
        {counters.map((counter, i) => (
          <div key={counter.label} className="flex items-center">
            <div
              className={`text-center px-7 md:px-10 transition-all duration-700 ease-out ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="text-[28px] md:text-[32px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white">
                <AnimatedNumber value={counter.value} visible={visible} />
                {counter.suffix}
              </span>
              <p className="text-[12px] text-[#86868b] dark:text-[#6e6e73] mt-0.5">{counter.label}</p>
            </div>
            {i < counters.length - 1 && (
              <div className={`hidden md:block w-px h-8 bg-black/[0.06] dark:bg-white/[0.08] transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AnimatedNumber = ({ value, visible }: { value: number; visible: boolean }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [visible, value]);
  return <>{display.toLocaleString()}</>;
};

export default TrustBar;
