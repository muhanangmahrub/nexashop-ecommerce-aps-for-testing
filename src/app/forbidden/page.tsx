import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Access Denied' };

export default function ForbiddenPage() {
  return (
    <div className="container flex flex-col items-center py-24 text-center" data-testid="forbidden-page">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <p className="mt-4 text-5xl font-extrabold">403</p>
      <h1 className="mt-2 text-2xl font-bold" data-testid="forbidden-title">
        Access denied
      </h1>
      <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
      <Link href="/" className="mt-6">
        <Button data-testid="forbidden-home-btn">Go home</Button>
      </Link>
    </div>
  );
}
