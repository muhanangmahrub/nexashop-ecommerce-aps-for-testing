'use client';

import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const KEY = 'nexashop-cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(KEY));
    } catch {
      setVisible(true);
    }
  }, []);
  const decide = (value: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t bg-card p-4 shadow-2xl" role="dialog" aria-label="Cookie consent" data-testid="cookie-consent-banner">
      <div className="container flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Cookie className="hidden h-6 w-6 shrink-0 text-primary sm:block" />
        <p className="flex-1 text-sm text-muted-foreground">
          We use cookies to keep you signed in, remember your cart and improve your experience. You can accept all cookies or only essential ones.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => decide('rejected')} data-testid="cookie-consent-reject">
            Essential only
          </Button>
          <Button size="sm" onClick={() => decide('accepted')} data-testid="cookie-consent-accept">
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
