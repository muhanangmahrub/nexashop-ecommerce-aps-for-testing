'use client';

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string> = {},
    public code?: string,
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh() {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => setTimeout(() => (refreshing = null), 0));
  }
  return refreshing;
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; skipRefresh?: boolean };

/** JSON fetch wrapper: unwraps `{success,data}`, throws ApiClientError, transparently refreshes expired sessions. */
export async function api<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { body, skipRefresh, headers, ...rest } = opts;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const init: RequestInit = {
    ...rest,
    credentials: 'same-origin',
    headers: { ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  };
  let res = await fetch(path, init);
  if (res.status === 401 && !skipRefresh && !path.startsWith('/api/auth/')) {
    if (await tryRefresh()) res = await fetch(path, init);
  }
  if (res.status === 204) return undefined as T;
  let json: { success?: boolean; data?: T; message?: string; errors?: Record<string, string>; code?: string } = {};
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw new ApiClientError(res.status, res.statusText || 'Request failed');
  }
  if (!res.ok || json.success === false)
    throw new ApiClientError(res.status, json.message ?? 'Something went wrong', json.errors ?? {}, json.code);
  return json.data as T;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong') {
  return err instanceof ApiClientError || err instanceof Error ? err.message : fallback;
}

export function fieldErrors(err: unknown): Record<string, string> {
  return err instanceof ApiClientError ? err.errors : {};
}
