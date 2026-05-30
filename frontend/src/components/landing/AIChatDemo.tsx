import { useEffect, useRef, useState } from 'react';

const messages = [
  { role: 'user', text: 'Which suppliers should I be worried about?' },
  {
    role: 'ai',
    text: 'Based on your data, 2 suppliers have elevated delay risk:',
    items: [
      {
        name: 'Acme Corp',
        risk: '72%',
        reason: 'Lead time increased 40% this quarter',
      },
      {
        name: 'GlobalParts Ltd',
        risk: '58%',
        reason: '3 of last 5 shipments delayed',
      },
    ],
    suggestion:
      "I recommend reviewing Acme Corp's contract terms and sourcing an alternative for critical components.",
  },
];

const AIChatDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showItems, setShowItems] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);

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

  useEffect(() => {
    if (!visible) return;
    const text = messages[1].text;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowItems(true), 300);
        setTimeout(() => setShowSuggestion(true), 800);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-black">
      <div className="max-w-[800px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2
            className={`text-[clamp(40px,7vw,72px)] font-bold tracking-[-0.04em] text-white leading-[1.05] mb-4 transition-all duration-700 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Ask anything.
          </h2>
          <p
            className={`text-[clamp(17px,2vw,21px)] text-white/40 font-light max-w-[500px] mx-auto transition-all duration-700 ease-out delay-100 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            Conversational intelligence. Get structured answers with risk levels and
            recommendations.
          </p>
        </div>

        {/* Chat container */}
        <div
          className={`rounded-[24px] border border-white/[0.06] bg-[#1c1c1e] overflow-hidden shadow-[0_0_80px_-20px_rgba(10,132,255,0.1)] transition-all duration-700 ease-out delay-200 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-full bg-[#0a84ff]/10 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#0a84ff]">AI</span>
            </div>
            <div>
              <p className="text-[14px] font-medium text-white">Supply Chain Assistant</p>
              <p className="text-[11px] text-[#30d158] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 space-y-5 min-h-[320px]">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[75%] px-5 py-3 rounded-[20px] rounded-br-sm bg-[#0a84ff] text-white text-[14px] leading-relaxed">
                {messages[0].text}
              </div>
            </div>

            {/* AI response */}
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#0a84ff]">AI</span>
              </div>
              <div className="max-w-[82%] space-y-3">
                {/* Typing text */}
                <div className="px-5 py-3 rounded-[20px] rounded-tl-sm bg-white/[0.04] text-[14px] text-white/80 leading-relaxed">
                  {typedText}
                  {typedText.length < messages[1].text.length && (
                    <span className="inline-block w-[1.5px] h-[14px] bg-white/60 ml-0.5 animate-pulse" />
                  )}
                </div>

                {/* Supplier cards */}
                {showItems && messages[1].items && (
                  <div className="space-y-2 animate-fade-in-up">
                    {messages[1].items.map((item) => (
                      <div
                        key={item.name}
                        className="px-5 py-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-white">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a]">
                            {item.risk} delay risk
                          </span>
                        </div>
                        <p className="text-[12px] text-white/30">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                {showSuggestion && (
                  <div className="px-5 py-4 rounded-[16px] bg-[#0a84ff]/[0.06] border border-[#0a84ff]/[0.1] animate-fade-in-up">
                    <p className="text-[13px] text-[#0a84ff] leading-relaxed">
                      {messages[1].suggestion}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-6 py-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-[#0a84ff]/10 flex items-center justify-center">
                <span className="text-[8px] font-bold text-[#0a84ff]">AI</span>
              </div>
              <span className="text-[13px] text-white/20 flex-1">
                Ask anything about your supply chain...
              </span>
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <span className="text-black text-[12px] font-medium">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIChatDemo;
