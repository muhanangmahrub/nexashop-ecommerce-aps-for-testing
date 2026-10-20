'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} data-testid="theme-toggle" data-theme={theme}>
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
