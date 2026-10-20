'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '6rem 1rem' }} data-testid="global-error-page">
        <h1 style={{ fontSize: '4rem', color: '#dc2626', margin: 0 }}>500</h1>
        <h2>Something went wrong</h2>
        <p>A critical error occurred while loading the application.</p>
        <button onClick={reset} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }} data-testid="global-error-retry-btn">
          Try again
        </button>
      </body>
    </html>
  );
}
