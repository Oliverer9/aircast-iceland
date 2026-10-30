import { useEffect, useState } from 'react';

// Light or dark. Follows the system setting until the visitor chooses, then remembers
// the choice in this browser. The page's colours switch on <html data-theme="dark">.

const STORAGE_KEY = 'aircast-theme';

function startingTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage can be blocked; use the system setting.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState(startingTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not saving the choice is fine.
    }
  }

  return { dark: theme === 'dark', toggle };
}
