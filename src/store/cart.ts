import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart, CartItem } from '@/types';
import { api } from '@/lib/client';
import { useAuthStore } from './auth';

export interface GuestItemInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  slug: string;
  image: string | null;
  variantName: string | null;
  unitPrice: number;
  availableStock: number;
}

interface CartState {
  guestItems: CartItem[];
  server: Cart | null;
  loading: boolean;
  items: () => CartItem[];
  subtotal: () => number;
  count: () => number;
  load: () => Promise<void>;
  add: (input: GuestItemInput) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  mergeGuest: () => Promise<string[]>;
  setServer: (cart: Cart) => void;
  reset: () => void;
}

const isAuthed = () => Boolean(useAuthStore.getState().user);
const guestId = (productId: string, variantId: string | null) => `guest:${productId}:${variantId ?? ''}`;

export class CartError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      guestItems: [],
      server: null,
      loading: false,
      items: () => (isAuthed() ? (get().server?.items ?? []) : get().guestItems),
      subtotal: () => Math.round(get().items().reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100,
      count: () => get().items().reduce((s, i) => s + i.quantity, 0),
      setServer: (cart) => {
        set({ server: cart });
        useAuthStore.getState().setCounts({ cart: cart.itemCount });
      },
      load: async () => {
        if (!isAuthed()) return;
        set({ loading: true });
        try {
          get().setServer(await api<Cart>('/api/cart'));
        } finally {
          set({ loading: false });
        }
      },
      add: async (input) => {
        if (isAuthed()) {
          get().setServer(
            await api<Cart>('/api/cart/items', {
              method: 'POST',
              body: { productId: input.productId, variantId: input.variantId, quantity: input.quantity },
            }),
          );
          return;
        }
        const id = guestId(input.productId, input.variantId);
        const items = [...get().guestItems];
        const existing = items.find((i) => i.id === id);
        const newQty = (existing?.quantity ?? 0) + input.quantity;
        if (newQty > input.availableStock)
          throw new CartError(`Only ${input.availableStock} item(s) available in stock`, {
            quantity: `Only ${input.availableStock} item(s) available`,
          });
        if (newQty > 99) throw new CartError('Maximum quantity per item is 99');
        if (existing) {
          existing.quantity = newQty;
          existing.lineTotal = Math.round(existing.unitPrice * newQty * 100) / 100;
        } else {
          items.push({
            id,
            ...input,
            lineTotal: Math.round(input.unitPrice * input.quantity * 100) / 100,
            stockStatus: input.availableStock <= 0 ? 'OUT_OF_STOCK' : input.availableStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK',
          });
        }
        set({ guestItems: items });
      },
      update: async (itemId, quantity) => {
        if (isAuthed()) {
          get().setServer(await api<Cart>(`/api/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } }));
          return;
        }
        const item = get().guestItems.find((i) => i.id === itemId);
        if (!item) return;
        if (quantity < 1) throw new CartError('Quantity must be at least 1');
        if (quantity > item.availableStock) throw new CartError(`Only ${item.availableStock} item(s) available in stock`);
        set({
          guestItems: get().guestItems.map((i) =>
            i.id === itemId ? { ...i, quantity, lineTotal: Math.round(i.unitPrice * quantity * 100) / 100 } : i,
          ),
        });
      },
      remove: async (itemId) => {
        if (isAuthed()) {
          // Optimistic removal with rollback.
          const prev = get().server;
          if (prev) set({ server: { ...prev, items: prev.items.filter((i) => i.id !== itemId) } });
          try {
            get().setServer(await api<Cart>(`/api/cart/items/${itemId}`, { method: 'DELETE' }));
          } catch (e) {
            set({ server: prev });
            throw e;
          }
          return;
        }
        set({ guestItems: get().guestItems.filter((i) => i.id !== itemId) });
      },
      clear: async () => {
        if (isAuthed()) {
          get().setServer(await api<Cart>('/api/cart', { method: 'DELETE' }));
          return;
        }
        set({ guestItems: [] });
      },
      mergeGuest: async () => {
        const guest = get().guestItems;
        if (!guest.length) {
          await get().load();
          return [];
        }
        const res = await api<{ cart: Cart; skipped: string[] }>('/api/cart/merge', {
          method: 'POST',
          body: { items: guest.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })) },
        });
        set({ guestItems: [] });
        get().setServer(res.cart);
        return res.skipped;
      },
      reset: () => set({ server: null }),
    }),
    { name: 'nexashop-guest-cart', partialize: (s) => ({ guestItems: s.guestItems }) },
  ),
);
