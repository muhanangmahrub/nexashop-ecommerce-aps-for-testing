import { Prisma } from '@prisma/client';

/** Recursively converts Prisma Decimal values into plain numbers (and Dates into ISO strings). */
export function serialize<T>(value: T): T {
  return walk(value) as T;
}

function walk(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  if (Prisma.Decimal.isDecimal(v)) return Number((v as Prisma.Decimal).toString());
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(walk);
  if (typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = walk(val);
    return out;
  }
  return v;
}
