import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useStreamingQuery() {
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const ask = useCallback((question: string) => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setAnswer('');
    setError(null);
    setIsStreaming(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setIsStreaming(false);
      return;
    }

    const params = new URLSearchParams({
      question,
      token,
    });

    const es = new EventSource(`${API_BASE_URL}/ai/query/stream?${params}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      setAnswer((prev) => prev + event.data);
    };

    es.addEventListener('done', () => {
      es.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
      setError('Connection to AI service failed. Please try again.');
    };
  }, []);

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { answer, isStreaming, error, ask, cancel };
}
