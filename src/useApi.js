import { useEffect, useState } from 'react';

// Fetches one of our own /api routes and tracks loading and error state.
export function useApi(url) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        setState({ status: 'success', data: body, error: null });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', data: null, error: err.message });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}
