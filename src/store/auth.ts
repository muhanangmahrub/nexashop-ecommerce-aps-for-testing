import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/lib/client';

interface Counts {
  cart: number;
  wishlist: number;
  notifications: number;
}

interface AuthState {
  user: User | null;
  counts: Counts;
  status: 'idle' | 'loading' | 'ready';
  fetchMe: () => Promise<User | null>;
  setUser: (u: User | null) => void;
  setCounts: (c: Partial<Counts>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  counts: { cart: 0, wishlist: 0, notifications: 0 },
  status: 'idle',
  fetchMe: async () => {
    set({ status: 'loading' });
    try {
      const data = await api<{ user: User | null; counts: Counts }>('/api/auth/me');
      set({ user: data.user, counts: data.counts, status: 'ready' });
      return data.user;
    } catch {
      set({ user: null, counts: { cart: 0, wishlist: 0, notifications: 0 }, status: 'ready' });
      return null;
    }
  },
  setUser: (user) => set({ user }),
  setCounts: (c) => set({ counts: { ...get().counts, ...c } }),
  logout: async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    set({ user: null, counts: { cart: 0, wishlist: 0, notifications: 0 } });
  },
}));
