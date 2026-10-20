'use client';

import { useState } from 'react';
import { useCartStore, type GuestItemInput } from '@/store/cart';
import { toast } from '@/store/toast';
import { errorMessage } from '@/lib/client';

export function useAddToCart() {
  const add = useCartStore((s) => s.add);
  const [pending, setPending] = useState(false);
  const addToCart = async (input: GuestItemInput) => {
    setPending(true);
    try {
      await add(input);
      toast.success(`${input.name} added to cart`);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setPending(false);
    }
  };
  return { addToCart, pending };
}
