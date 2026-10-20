'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Boxes, FolderTree, LayoutDashboard, Package, ShoppingBag, Ticket, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { href: '/admin/products', label: 'Products', icon: Package, id: 'products' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, id: 'categories' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, id: 'orders' },
  { href: '/admin/users', label: 'Users', icon: Users, id: 'users' },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket, id: 'coupons' },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes, id: 'inventory' },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, id: 'reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="container grid gap-6 py-6 lg:grid-cols-[210px_1fr]" data-testid="admin-layout">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col" data-testid="admin-nav">
        <p className="hidden px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground lg:block">Admin</p>
        {LINKS.map(({ href, label, icon: Icon, id }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm', active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} data-testid={`admin-nav-${id}`} aria-current={active ? 'page' : undefined}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
