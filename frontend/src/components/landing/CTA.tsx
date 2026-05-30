import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
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
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#f5f5f7] dark:bg-[#0a0a0a]">
      <div className="max-w-[560px] mx-auto text-center">
        <h2 className={`text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-white mb-4 text-balance transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          Ready to transform your supply chain?
        </h2>
        <p className={`text-[16px] text-[#86868b] dark:text-[#a1a1a6] mb-8 transition-all duration-700 ease-out delay-75 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          Get started in minutes. No credit card required.
        </p>
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-700 ease-out delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0071e3] dark:bg-[#0a84ff] text-white text-[15px] font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a8aff] transition-all duration-200 active:scale-[0.97]"
          >
            Start free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#e8e8ed] dark:bg-white/10 text-[#1d1d1f] dark:text-white text-[15px] font-medium hover:bg-[#d2d2d7] dark:hover:bg-white/15 transition-all duration-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;
