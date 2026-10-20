import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-24 text-center" data-testid="not-found-page">
      <p className="text-7xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold" data-testid="not-found-title">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button data-testid="not-found-home-btn">Go home</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" data-testid="not-found-shop-btn">
            Browse products
          </Button>
        </Link>
      </div>
    </div>
  );
}
