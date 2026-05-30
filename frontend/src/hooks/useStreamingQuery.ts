import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useStreamingQuery() {
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const ask = useCallback((question: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const params = new URLSearchParams({ question });

    fetch(`${API_BASE_URL}/ai/query/stream?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          // Token expired or invalid — clear auth and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired');
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event: done')) {
              setIsStreaming(false);
              abortControllerRef.current = null;
              return;
            }

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data.startsWith('Error:')) {
                setError(data);
                setIsStreaming(false);
                abortControllerRef.current = null;
                return;
              }
              setAnswer((prev) => prev + data);
            }
          }
        }

        setIsStreaming(false);
        abortControllerRef.current = null;
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setIsStreaming(false);
        abortControllerRef.current = null;
        setError('Connection to AI service failed. Please try again.');
      });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { answer, isStreaming, error, ask, cancel };
}
