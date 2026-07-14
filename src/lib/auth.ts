"use client";

export function saveToken(token: string, refreshToken?: string) {
  localStorage.setItem("admin_token", token);
  if (refreshToken) localStorage.setItem("admin_refresh_token", refreshToken);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_refresh_token");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_refresh_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
