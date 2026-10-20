import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Server Error' };

/** Static 500 page (also reachable directly for UI testing). */
export default function ServerErrorPage() {
  return (
    <div className="container flex flex-col items-center py-24 text-center" data-testid="server-error-page">
      <p className="text-7xl font-extrabold text-destructive">500</p>
      <h1 className="mt-4 text-2xl font-bold">Internal server error</h1>
      <p className="mt-2 text-muted-foreground">Something went wrong on our end. Please try again later.</p>
      <Link href="/" className="mt-6">
        <Button data-testid="server-error-home-btn">Go home</Button>
      </Link>
    </div>
  );
}
