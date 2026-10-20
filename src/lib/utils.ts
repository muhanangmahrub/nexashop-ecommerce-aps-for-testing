import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value: number | string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

export function formatDate(value: string | Date, withTime = false) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function stockStatus(stock: number, threshold = 5): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function placeholderImage(text: string, color = '6366f1') {
  return `/api/images/placeholder?text=${encodeURIComponent(text)}&color=${color}`;
}
