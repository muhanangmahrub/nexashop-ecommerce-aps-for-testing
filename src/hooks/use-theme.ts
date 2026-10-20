'use client';

import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');
  useEffect(() => {
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);
  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    try {
      localStorage.setItem('nexashop-theme', t);
    } catch {
      /* storage unavailable */
    }
    setThemeState(t);
  }, []);
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
