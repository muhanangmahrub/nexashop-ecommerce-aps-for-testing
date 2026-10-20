import type { ZodTypeAny, output } from 'zod';

/** Runs a zod schema client-side and returns either parsed data or a field->message map. */
export function validate<S extends ZodTypeAny>(
  schema: S,
  values: unknown,
): { data: output<S>; errors: null } | { data: null; errors: Record<string, string> } {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data, errors: null };
  const errors: Record<string, string> = {};
  for (const i of r.error.issues) {
    const k = i.path.join('.') || '_form';
    if (!errors[k]) errors[k] = i.message;
  }
  return { data: null, errors };
}
