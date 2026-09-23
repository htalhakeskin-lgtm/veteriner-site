/**
 * Tip guvenli API istemcisi.
 *
 * Access token BELLEKTE tutulur, localStorage'da degil: localStorage'daki
 * bir token sayfada calisan herhangi bir XSS ile okunabilirdi. Sayfa
 * yenilendiginde httpOnly refresh cookie uzerinden sessizce yeniden alinir.
 */

const BASE = '/api/v1';

let accessToken: string | null = null;
/** Ayni anda gelen birden fazla 401'de tek bir yenileme istegi yapilsin. */
let refreshPromise: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Sunucu tarafi render sirasinda cerezleri iletmek icin */
  headers?: Record<string, string>;
  /** 401 alindiginda token yenilemeyi dene (ic kullanim) */
  _retried?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers = {}, _retried, ...rest } = options;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    credentials: 'include', // refresh cookie tasinsin
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Access token suresi dolduysa sessizce yenile ve bir kez daha dene.
  // Kullanici bunu hic fark etmemeli.
  if (res.status === 401 && !_retried && path !== '/auth/refresh') {
    const ok = await refreshOnce();
    if (ok) return request<T>(path, { ...options, _retried: true });
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const err = data as { message?: string; code?: string } | null;
    throw new ApiError(
      res.status,
      err?.message ?? 'Beklenmeyen bir hata olustu.',
      err?.code,
    );
  }

  return data as T;
}

async function refreshOnce(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return true;
    } catch {
      accessToken = null;
      return false;
    } finally {
      // Bir sonraki 401'de yeniden denenebilsin.
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }
  })();

  return refreshPromise;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  refresh: refreshOnce,
};

/**
 * Sunucu tarafi (loader) icin: tarayici proxy'si yok, API'ye dogrudan
 * gidilir ve istegin kendi cerezleri iletilir.
 */
export async function serverFetch<T>(
  path: string,
  request?: Request,
): Promise<T> {
  const origin = process.env.API_URL ?? 'http://localhost:3000';
  const cookie = request?.headers.get('cookie');

  const res = await fetch(`${origin}${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    let message = 'Veri alinamadi.';
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? message;
    } catch {
      /* metin JSON degilse varsayilan mesaj kalir */
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}
