import { useState } from 'react';
import { Send, Sparkles, XCircle } from 'lucide-react';
import { useStreamingQuery } from '../hooks/useStreamingQuery';

const AskAI = () => {
  const [question, setQuestion] = useState('');
  const { answer, isStreaming, error, ask, cancel } = useStreamingQuery();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isStreaming) return;
    ask(trimmed);
  };

  return (
    <section className="mb-20">
      <div className="bg-white rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-[#0071e3]" />
          <h2 className="text-lg font-medium text-[#1d1d1f]">Ask AI</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your supply chain..."
            disabled={isStreaming}
            className="
              flex-1 px-5 py-3.5 rounded-xl
              bg-[#f5f5f7] text-[#1d1d1f]
              placeholder:text-[#86868b]
              outline-none
              transition-all duration-200
              focus:ring-2 focus:ring-[#0071e3]/20
              disabled:opacity-60
            "
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={cancel}
              className="
                inline-flex items-center gap-2 px-6 py-3.5
                bg-[#ff3b30] text-white rounded-xl
                text-sm font-medium
                hover:bg-[#e0352b] transition-all duration-200
              "
            >
              <XCircle className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!question.trim()}
              className="
                inline-flex items-center gap-2 px-6 py-3.5
                bg-[#1d1d1f] text-white rounded-xl
                text-sm font-medium
                hover:bg-black transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Send className="w-4 h-4" />
              Ask
            </button>
          )}
        </form>

        {error && (
          <div className="rounded-xl bg-[#fff4f4] px-5 py-4 text-sm text-[#b42318]">
            {error}
          </div>
        )}

        {(answer || isStreaming) && (
          <div className="rounded-xl bg-[#f5f5f7] px-6 py-5">
            <p className="text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">
              {answer}
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-[#0071e3] ml-0.5 animate-pulse rounded-sm" />
              )}
            </p>
          </div>
        )}

        {!answer && !isStreaming && !error && (
          <p className="text-sm text-[#86868b]">
            Try: "Which products are at risk of stockout?" or "How are my suppliers performing?"
          </p>
        )}
      </div>
    </section>
  );
};

export default AskAI;
