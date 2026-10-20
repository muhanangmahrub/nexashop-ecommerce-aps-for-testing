'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, MapPin, Package, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { toast } from '@/store/toast';
import { Avatar } from './avatar';

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const isAdmin = user.role !== 'CUSTOMER';

  const onLogout = async () => {
    setOpen(false);
    await logout();
    useCartStore.getState().reset();
    useWishlistStore.getState().reset();
    toast.success('You have been logged out');
    router.push('/');
    router.refresh();
  };

  const item = 'flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent';
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full p-1 hover:bg-accent" aria-label="Account menu" data-testid="user-menu-button">
        <Avatar name={user.name} src={user.avatar} size={32} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-card shadow-lg" data-testid="user-menu-dropdown">
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-semibold" data-testid="user-menu-name">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground" data-testid="user-menu-email">
              {user.email}
            </p>
          </div>
          <Link href="/account" className={item} onClick={() => setOpen(false)} data-testid="user-menu-profile">
            <UserIcon className="h-4 w-4" /> My Profile
          </Link>
          <Link href="/account/orders" className={item} onClick={() => setOpen(false)} data-testid="user-menu-orders">
            <Package className="h-4 w-4" /> My Orders
          </Link>
          <Link href="/account/addresses" className={item} onClick={() => setOpen(false)} data-testid="user-menu-addresses">
            <MapPin className="h-4 w-4" /> Addresses
          </Link>
          {isAdmin && (
            <Link href="/admin" className={item} onClick={() => setOpen(false)} data-testid="user-menu-admin">
              <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
            </Link>
          )}
          <button onClick={onLogout} className={`${item} w-full border-t text-destructive`} data-testid="logout-button">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
