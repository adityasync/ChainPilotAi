import { useState } from 'react';
import { Send, Sparkles, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-[#0071e3]" />
          <h2 className="text-lg font-medium text-[#1d1d1f] dark:text-white">Ask AI</h2>
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
              bg-[#f5f5f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white
              placeholder:text-[#86868b] dark:placeholder:text-[#98989d]
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
                bg-[#ff3b30] dark:bg-red-600 text-white rounded-xl
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
                bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-xl
                text-sm font-medium
                hover:bg-black dark:hover:bg-gray-200 transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Send className="w-4 h-4" />
              Ask
            </button>
          )}
        </form>

        {error && (
          <div className="rounded-xl bg-[#fff4f4] dark:bg-red-900/20 px-5 py-4 text-sm text-[#b42318] dark:text-red-400">
            {error}
          </div>
        )}

        {(answer || isStreaming) && (
          <div className="rounded-xl bg-[#f5f5f7] dark:bg-[#2c2c2e] px-6 py-5">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-[#1d1d1f] dark:prose-strong:text-white prose-code:text-[#0071e3] dark:prose-code:text-blue-400 prose-code:bg-[#e8e8ed] dark:prose-code:bg-[#3a3a3c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none prose-a:text-[#0071e3] dark:prose-a:text-blue-400 prose-table:text-sm prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-th:bg-[#e8e8ed] dark:prose-th:bg-[#3a3a3c]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-[#0071e3] ml-0.5 animate-pulse rounded-sm align-middle" />
              )}
            </div>
          </div>
        )}

        {!answer && !isStreaming && !error && (
          <p className="text-sm text-[#86868b] dark:text-[#98989d]">
            Try: "Which products are at risk of stockout?" or "How are my suppliers performing?"
          </p>
        )}
      </div>
    </section>
  );
};

export default AskAI;
