import { useEffect, useState } from 'react';

// Fetches one of our own /api routes and tracks loading and error state.
// With refreshMs it fetches again on that interval, keeping the old data on screen
// while the new data loads, so the page doesn't flash back to "Loading…".
export function useApi(url, refreshMs = 0) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    if (!url) return undefined;
    let controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    function load(isRefresh) {
      controller = new AbortController();
      fetch(url, { signal: controller.signal })
        .then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
          setState({ status: 'success', data: body, error: null });
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          // A failed refresh keeps showing the data we already have.
          if (isRefresh) return;
          setState({ status: 'error', data: null, error: err.message });
        });
    }

    load(false);
    const timer = refreshMs ? setInterval(() => load(true), refreshMs) : null;

    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [url, refreshMs]);

  return state;
}
