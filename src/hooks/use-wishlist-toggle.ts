'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import { toast } from '@/store/toast';
import { errorMessage } from '@/lib/client';

export function useWishlistToggle() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const ids = useWishlistStore((s) => s.ids);
  const toggleStore = useWishlistStore((s) => s.toggle);
  const toggle = async (productId: string, name: string) => {
    if (!user) {
      toast.warning('Please log in to use your wishlist');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    try {
      const added = await toggleStore(productId);
      toast.success(added ? `${name} added to wishlist` : `${name} removed from wishlist`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return { toggle, has: (id: string) => ids.has(id) };
}
