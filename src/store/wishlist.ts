import { create } from 'zustand';
import { api } from '@/lib/client';
import { useAuthStore } from './auth';

interface WishlistState {
  ids: Set<string>;
  loaded: boolean;
  load: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>;
  remove: (productId: string) => void;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,
  load: async () => {
    const items = await api<{ product: { id: string } }[]>('/api/wishlist');
    set({ ids: new Set(items.map((i) => i.product.id)), loaded: true });
    useAuthStore.getState().setCounts({ wishlist: items.length });
  },
  /** Optimistically toggles a product; returns the new "in wishlist" state. */
  toggle: async (productId) => {
    const had = get().ids.has(productId);
    const next = new Set(get().ids);
    if (had) next.delete(productId);
    else next.add(productId);
    set({ ids: next });
    useAuthStore.getState().setCounts({ wishlist: next.size });
    try {
      const res = had
        ? await api<{ count: number }>(`/api/wishlist/${productId}`, { method: 'DELETE' })
        : await api<{ count: number }>('/api/wishlist', { method: 'POST', body: { productId } });
      useAuthStore.getState().setCounts({ wishlist: res.count });
      return !had;
    } catch (e) {
      const rollback = new Set(get().ids);
      if (had) rollback.add(productId);
      else rollback.delete(productId);
      set({ ids: rollback });
      useAuthStore.getState().setCounts({ wishlist: rollback.size });
      throw e;
    }
  },
  remove: (productId) => {
    const next = new Set(get().ids);
    next.delete(productId);
    set({ ids: next });
    useAuthStore.getState().setCounts({ wishlist: next.size });
  },
  reset: () => set({ ids: new Set(), loaded: false }),
}));
