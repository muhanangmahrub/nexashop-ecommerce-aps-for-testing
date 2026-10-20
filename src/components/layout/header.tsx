'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, ShoppingCart, Store, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { SearchBar } from './search-bar';
import { ThemeToggle } from './theme-toggle';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';

const NAV = [
  { href: '/products', label: 'All Products' },
  { href: '/products?category=electronics', label: 'Electronics' },
  { href: '/products?category=fashion', label: 'Fashion' },
  { href: '/products?category=food', label: 'Food' },
  { href: '/products?category=books', label: 'Books' },
  { href: '/products?category=sports', label: 'Sports' },
];

function CountBadge({ value, testId }: { value: number; testId: string }) {
  if (value <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground" data-testid={testId}>
      {value > 99 ? '99+' : value}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, status, counts } = useAuthStore();
  const guestCount = useCartStore((s) => s.guestItems.reduce((n, i) => n + i.quantity, 0));
  const cartCount = user ? counts.cart : guestCount;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur" data-testid="site-header">
      <div className="container flex h-16 items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu" data-testid="mobile-menu-toggle">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary" data-testid="header-logo">
          <Store className="h-6 w-6" />
          <span className="hidden sm:inline">NexaShop</span>
        </Link>
        <SearchBar className="mx-2 hidden max-w-xl flex-1 md:block" testId="header-search" />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <Link href="/wishlist" aria-label="Wishlist" data-testid="header-wishlist-link" className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent">
              <Heart className="h-5 w-5" />
              <CountBadge value={counts.wishlist} testId="wishlist-count-badge" />
            </Link>
          )}
          <Link href="/cart" aria-label="Cart" data-testid="header-cart-link" className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent">
            <ShoppingCart className="h-5 w-5" />
            {mounted && <CountBadge value={cartCount} testId="cart-count-badge" />}
          </Link>
          {user && <NotificationBell />}
          {user ? (
            <UserMenu />
          ) : status === 'ready' ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                <Button variant="ghost" size="sm" data-testid="header-login-link">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" data-testid="header-register-link">
                  Sign up
                </Button>
              </Link>
            </div>
          ) : (
            <div className="h-9 w-24" />
          )}
        </div>
      </div>
      <nav className="container hidden h-10 items-center gap-6 text-sm md:flex" data-testid="category-nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="text-muted-foreground hover:text-foreground" data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, '-')}`}>
            {n.label}
          </Link>
        ))}
      </nav>
      {mobileOpen && (
        <div className="border-t md:hidden" data-testid="mobile-menu">
          <div className="container space-y-3 py-4">
            <SearchBar testId="mobile-search" />
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block py-1 text-sm" data-testid={`mobile-nav-${n.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {n.label}
              </Link>
            ))}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full" data-testid="mobile-login-link">
                    Log in
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full" data-testid="mobile-register-link">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
