import { getToken, getRefreshToken, saveToken, clearToken } from "@/lib/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const newAccess: string = json?.data?.accessToken;
    const newRefresh: string = json?.data?.refreshToken;
    if (!newAccess) return null;
    saveToken(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  _retry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, _retry, ...init } = options;
  const url = new URL(BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url.toString(), { ...init, headers });

  // Auto-refresh on 401
  if (res.status === 401 && !_retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefresh();
      isRefreshing = false;
      if (newToken) {
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        return request<T>(path, { ...options, _retry: true });
      } else {
        // Refresh failed — clear tokens and redirect to login
        clearToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // Another request is already refreshing — queue this one
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          fetch(url.toString(), { ...init, headers })
            .then((r) => r.json().then(resolve))
            .catch(reject);
        });
      });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean>) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};
