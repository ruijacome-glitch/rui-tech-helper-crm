const API_URL = import.meta.env.VITE_API_URL as string;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) return;
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

/**
 * All state-changing methods (POST/PATCH/DELETE) require the Sanctum CSRF
 * cookie to already be set, then echo it back as X-XSRF-TOKEN — Sanctum's SPA
 * guard rejects the request otherwise. GET requests skip the CSRF round-trip.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';

  if (method !== 'GET') {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const xsrfToken = readCookie('XSRF-TOKEN');
  if (xsrfToken && method !== 'GET') {
    headers['X-XSRF-TOKEN'] = xsrfToken;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}
