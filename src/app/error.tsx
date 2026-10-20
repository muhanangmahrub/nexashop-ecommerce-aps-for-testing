'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container flex flex-col items-center py-24 text-center" data-testid="error-page">
      <p className="text-7xl font-extrabold text-destructive">500</p>
      <h1 className="mt-4 text-2xl font-bold" data-testid="error-page-title">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">An unexpected error occurred. Please try again.</p>
      {error.digest && <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} data-testid="error-page-retry-btn">
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" data-testid="error-page-home-btn">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
