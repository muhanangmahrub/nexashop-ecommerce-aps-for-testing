'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, MapPin, Package, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/account', label: 'Profile', icon: User, id: 'profile' },
  { href: '/account/security', label: 'Security', icon: Shield, id: 'security' },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin, id: 'addresses' },
  { href: '/account/orders', label: 'Orders', icon: Package, id: 'orders' },
  { href: '/account/notifications', label: 'Notifications', icon: Bell, id: 'notifications' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="container grid gap-6 py-6 md:grid-cols-[220px_1fr]" data-testid="account-layout">
      <nav className="flex gap-1 overflow-x-auto md:flex-col" data-testid="account-nav">
        {LINKS.map(({ href, label, icon: Icon, id }) => {
          const active = href === '/account' ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm', active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} data-testid={`account-nav-${id}`} aria-current={active ? 'page' : undefined}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
