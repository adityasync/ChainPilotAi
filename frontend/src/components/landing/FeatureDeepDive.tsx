import { useEffect, useRef, useState } from 'react';
import MLPipeline from './illustrations/MLPipeline';
import AIChat from './illustrations/AIChat';
import InventoryView from './illustrations/InventoryView';

const sections = [
  {
    tag: 'Machine Learning',
    title: 'Four models. One pipeline.',
    description:
      'Statistical forecasting and ML models analyze your data automatically — predicting demand with confidence intervals, classifying inventory risk, scoring supplier delays, and detecting cost anomalies.',
    points: [
      'Demand forecasting with EWMA, trend analysis, and seasonality',
      'Inventory risk classification across four severity levels',
      'Supplier delay probability scoring with XGBoost',
      'Cost anomaly detection with Isolation Forest',
    ],
    Illustration: MLPipeline,
    reverse: false,
  },
  {
    tag: 'AI Intelligence',
    title: 'Ask anything. Get answers.',
    description:
      'Natural language queries powered by LLM. Ask about stock levels, supplier risks, or demand trends in plain English — the AI reads your data and responds with structured insights.',
    points: [
      'Streaming responses with real-time token delivery',
      'Company-scoped context — no cross-tenant data leaks',
      'Auto-generated risk assessments with severity levels',
      'Supplier narratives cached for 24 hours',
    ],
    Illustration: AIChat,
    reverse: true,
  },
  {
    tag: 'Inventory Intelligence',
    title: 'See risk at a glance.',
    description:
      'Every inventory item is automatically classified by risk level. Dashboards show exactly what needs attention — from stockout emergencies to overstock waste.',
    points: [
      'Automatic risk status: HEALTHY, RISK, CRITICAL, OVERSTOCK',
      'ML-powered risk scores from the inventory classifier',
      'Reorder point tracking with urgency indicators',
      'Multi-warehouse support with per-location views',
    ],
    Illustration: InventoryView,
    reverse: false,
  },
];

const FeatureDeepDive = () => {
  return (
    <section className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[980px] mx-auto space-y-[var(--space-section)]">
        {sections.map((section) => (
          <DeepDiveRow key={section.tag} {...section} />
        ))}
      </div>
    </section>
  );
};

const DeepDiveRow = ({
  tag, title, description, points, Illustration, reverse,
}: {
  tag: string; title: string; description: string; points: string[];
  Illustration: React.ComponentType; reverse: boolean;
}) => {
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
    <div
      ref={ref}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-14 lg:gap-24`}
    >
      <div className={`flex-1 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#0071e3] dark:text-[#0a84ff] mb-3 block">
          {tag}
        </span>
        <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white mb-4 leading-[1.1]">
          {title}
        </h2>
        <p className="text-[16px] leading-[1.6] text-[#86868b] dark:text-[#a1a1a6] mb-6">
          {description}
        </p>
        <ul className="space-y-2.5">
          {points.map((point, i) => (
            <li
              key={point}
              className={`flex items-start gap-3 transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}
              style={{ transitionDelay: `${300 + i * 80}ms` }}
            >
              <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-[#0071e3] dark:bg-[#0a84ff] flex-shrink-0" />
              <span className="text-[15px] text-[#1d1d1f] dark:text-white/90">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`flex-1 transition-all duration-700 ease-out delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="rounded-[16px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1c1c1e] p-3 shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_-6px_rgba(0,0,0,0.4)]">
          <Illustration />
        </div>
      </div>
    </div>
  );
};

export default FeatureDeepDive;
