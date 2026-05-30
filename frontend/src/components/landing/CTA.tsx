import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-black">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative rounded-[32px] overflow-hidden border border-white/[0.06] bg-[#1c1c1e]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,132,255,0.08)_0%,transparent_70%)]" />

          <div className="relative px-8 py-20 md:py-28 text-center">
            <h2
              className={`text-[clamp(36px,6vw,64px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-5 text-balance transition-all duration-700 ease-out ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              Ready to transform
              <br />
              your supply chain?
            </h2>
            <p
              className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light mb-10 max-w-[400px] mx-auto transition-all duration-700 ease-out delay-100 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              Get started in minutes. No credit card required.
            </p>
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 ease-out delay-200 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-[15px] font-medium hover:bg-white/90 transition-all duration-300 active:scale-[0.97]"
              >
                Start free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/[0.12] bg-white/[0.04] text-white text-[15px] font-medium hover:bg-white/[0.08] hover:border-white/[0.2] transition-all duration-300"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
