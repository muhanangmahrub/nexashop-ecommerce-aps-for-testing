import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Providers } from '@/components/layout/providers';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: 'NexaShop — Modern Online Shopping', template: '%s | NexaShop' },
  description: 'NexaShop is a modern B2C e-commerce platform for electronics, fashion, food, books and sports.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const themeScript = `(function(){try{var t=localStorage.getItem('nexashop-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col" data-test-mode={config.testMode ? 'true' : 'false'}>
        <Providers>
          <Header />
          <main className="flex-1" data-testid="main-content">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <Footer />
          <CookieConsent />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
