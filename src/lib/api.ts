import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodTypeAny, type output } from 'zod';
import { Prisma } from '@prisma/client';

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: FieldErrors,
    public code?: string,
  ) {
    super(message);
  }
}

export const errors = {
  badRequest: (message = 'Bad request', fieldErrors?: FieldErrors) => new ApiError(400, message, fieldErrors),
  unauthorized: (message = 'Authentication required') => new ApiError(401, message, undefined, 'UNAUTHORIZED'),
  forbidden: (message = 'You do not have permission to perform this action') =>
    new ApiError(403, message, undefined, 'FORBIDDEN'),
  notFound: (message = 'Resource not found') => new ApiError(404, message, undefined, 'NOT_FOUND'),
  conflict: (message: string, fieldErrors?: FieldErrors) => new ApiError(409, message, fieldErrors, 'CONFLICT'),
  unprocessable: (message: string, fieldErrors?: FieldErrors) =>
    new ApiError(422, message, fieldErrors, 'UNPROCESSABLE'),
  tooMany: (message = 'Too many requests, please try again later') =>
    new ApiError(429, message, undefined, 'RATE_LIMITED'),
};

export function ok<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json({ success: true, data }, { status, headers });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(status: number, message: string, fieldErrors?: FieldErrors, code?: string) {
  return NextResponse.json(
    { success: false, message, ...(fieldErrors ? { errors: fieldErrors } : {}), ...(code ? { code } : {}) },
    { status },
  );
}

export function zodToFieldErrors(err: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function parseBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw errors.badRequest('Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw errors.badRequest('Validation failed', zodToFieldErrors(result.error));
  return result.data;
}

export function parseQuery<S extends ZodTypeAny>(req: NextRequest | Request, schema: S): output<S> {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (v !== '') obj[k] = v;
  });
  const result = schema.safeParse(obj);
  if (!result.success) throw errors.badRequest('Invalid query parameters', zodToFieldErrors(result.error));
  return result.data;
}

type RouteContext = { params: Record<string, string> };
type Handler = (req: NextRequest, ctx: RouteContext) => Promise<Response>;

/** Wraps a route handler with uniform error -> HTTP response mapping. */
export function handler(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      // Let Next.js internal control-flow errors (dynamic usage, redirects, notFound) propagate.
      if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest: unknown }).digest === 'string') throw err;
      if (err instanceof ApiError) return fail(err.status, err.message, err.errors, err.code);
      if (err instanceof ZodError) return fail(400, 'Validation failed', zodToFieldErrors(err));
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') return fail(409, 'A record with this value already exists', undefined, 'CONFLICT');
        if (err.code === 'P2025') return fail(404, 'Resource not found', undefined, 'NOT_FOUND');
        if (err.code === 'P2003') return fail(409, 'Resource is referenced by other records', undefined, 'CONFLICT');
      }
      console.error('[api] unhandled error', err);
      return fail(500, 'Internal server error', undefined, 'INTERNAL');
    }
  };
}

export function paginate(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
