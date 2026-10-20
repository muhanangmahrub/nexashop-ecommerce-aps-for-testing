'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { toast } from '@/store/toast';

/** Bootstraps the session on load: fetch user, merge guest cart, load wishlist ids. */
export function Providers({ children }: { children: ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    (async () => {
      const user = await fetchMe();
      if (!user) return;
      try {
        const skipped = await useCartStore.getState().mergeGuest();
        if (skipped.length) toast.warning(`${skipped.length} item(s) from your guest cart were unavailable and removed`);
        await useWishlistStore.getState().load();
      } catch {
        /* non-fatal */
      }
    })();
  }, [fetchMe]);
  return <>{children}</>;
}
