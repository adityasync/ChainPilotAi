import { useEffect, useRef, useState } from 'react';

const messages = [
  { role: 'user', text: 'Which suppliers should I be worried about?' },
  {
    role: 'ai',
    text: 'Based on your data, 2 suppliers have elevated delay risk:',
    items: [
      { name: 'Acme Corp', risk: '72%', reason: 'Lead time increased 40% this quarter' },
      { name: 'GlobalParts Ltd', risk: '58%', reason: '3 of last 5 shipments delayed' },
    ],
    suggestion: "I recommend reviewing Acme Corp's contract terms and sourcing an alternative for critical components.",
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
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
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
      if (i < text.length) { setTypedText(text.slice(0, i + 1)); i++; }
      else {
        clearInterval(interval);
        setTimeout(() => setShowItems(true), 250);
        setTimeout(() => setShowSuggestion(true), 700);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <section ref={ref} className="py-[var(--space-section)] px-6 bg-[#fbfbfd] dark:bg-black">
      <div className="max-w-[720px] mx-auto">
        <div className="text-center mb-10">
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#0071e3] dark:text-[#0a84ff] mb-3 block">
            AI Assistant
          </span>
          <h2 className="text-[clamp(28px,4vw,42px)] font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white mb-3">
            Conversational intelligence.
          </h2>
          <p className="text-[16px] text-[#86868b] dark:text-[#a1a1a6] max-w-md mx-auto">
            Ask in English. Get structured answers with risk levels and recommendations.
          </p>
        </div>

        <div className={`rounded-[16px] border border-black/[0.04] dark:border-white/[0.06] bg-white dark:bg-[#1c1c1e] overflow-hidden shadow-[0_2px_24px_-6px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_24px_-6px_rgba(0,0,0,0.4)] transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06]">
            <div className="w-7 h-7 rounded-full bg-[#0071e3]/8 dark:bg-[#0a84ff]/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#0071e3] dark:text-[#0a84ff]">AI</span>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-white">Supply Chain Assistant</p>
              <p className="text-[11px] text-[#34c759] dark:text-[#30d158]">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="p-5 space-y-4 min-h-[300px]">
            <div className="flex justify-end">
              <div className="max-w-[75%] px-4 py-2.5 rounded-[16px] rounded-br-sm bg-[#0071e3] dark:bg-[#0a84ff] text-white text-[14px] leading-relaxed">
                {messages[0].text}
              </div>
            </div>

            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-[#0071e3] dark:text-[#0a84ff]">AI</span>
              </div>
              <div className="max-w-[82%] space-y-3">
                <div className="px-4 py-2.5 rounded-[16px] rounded-tl-sm bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[14px] text-[#1d1d1f] dark:text-white leading-relaxed">
                  {typedText}
                  {typedText.length < messages[1].text.length && (
                    <span className="inline-block w-[1px] h-[14px] bg-[#1d1d1f] dark:bg-white ml-0.5 animate-pulse" />
                  )}
                </div>

                {showItems && messages[1].items && (
                  <div className="space-y-2 animate-fade-in-up">
                    {messages[1].items.map((item) => (
                      <div key={item.name} className="px-4 py-3 rounded-[12px] bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[13px] font-medium text-[#1d1d1f] dark:text-white">{item.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ff9f0a]/8 text-[#ff9f0a]">
                            {item.risk} delay risk
                          </span>
                        </div>
                        <p className="text-[12px] text-[#86868b] dark:text-[#6e6e73]">{item.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {showSuggestion && (
                  <div className="px-4 py-3 rounded-[12px] bg-[#f0f5ff] dark:bg-[#0a84ff]/8 border border-[#0071e3]/8 dark:border-[#0a84ff]/10 animate-fade-in-up">
                    <p className="text-[13px] text-[#0071e3] dark:text-[#0a84ff] leading-relaxed">{messages[1].suggestion}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-5 py-3.5 border-t border-black/[0.04] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-[#f5f5f7] dark:bg-[#2c2c2e]">
              <span className="text-[13px] text-[#aeaeb2]">Ask anything about your supply chain...</span>
              <div className="ml-auto w-7 h-7 rounded-full bg-[#1d1d1f] dark:bg-white flex items-center justify-center">
                <span className="text-white dark:text-[#1d1d1f] text-[12px]">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIChatDemo;
