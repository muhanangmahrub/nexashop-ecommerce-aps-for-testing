'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { emailSchema } from '@/lib/validation';
import { toast } from '@/store/toast';
import { Button } from '@/components/ui/button';

export function Footer() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await api('/api/newsletter', { method: 'POST', body: { email: parsed.data } });
      setSuccess('Thanks for subscribing! Check your inbox.');
      setEmail('');
      toast.success('Subscribed to newsletter');
    } catch (err) {
      setError(fieldErrors(err).email ?? errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-16 border-t bg-muted/30" data-testid="site-footer">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary" data-testid="footer-logo">
            <Store className="h-5 w-5" /> NexaShop
          </Link>
          <p className="text-sm text-muted-foreground">Modern shopping for everyone. Quality products, fast delivery.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/products" data-testid="footer-link-products">All products</Link></li>
            <li><Link href="/products?sort=newest" data-testid="footer-link-new">New arrivals</Link></li>
            <li><Link href="/products?sort=best_seller" data-testid="footer-link-bestsellers">Best sellers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/account" data-testid="footer-link-account">My account</Link></li>
            <li><Link href="/account/orders" data-testid="footer-link-orders">Order history</Link></li>
            <li><Link href="/wishlist" data-testid="footer-link-wishlist">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Newsletter</h4>
          <p className="mb-3 text-sm text-muted-foreground">Get exclusive deals straight to your inbox.</p>
          <form onSubmit={subscribe} noValidate className="space-y-2" data-testid="newsletter-form">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for newsletter"
                data-testid="newsletter-email-input"
                className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" loading={loading} data-testid="newsletter-submit-btn">
                Subscribe
              </Button>
            </div>
            {error && <p className="text-xs text-destructive" role="alert" data-testid="newsletter-error">{error}</p>}
            {success && <p className="text-xs text-emerald-600" data-testid="newsletter-success">{success}</p>}
          </form>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} NexaShop. All rights reserved.</div>
    </footer>
  );
}
