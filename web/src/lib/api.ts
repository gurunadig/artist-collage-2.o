import type { Artist, Lookups, Paginated, User } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("ac_access");
}

export function setTokens(access: string, refresh: string) {
  window.localStorage.setItem("ac_access", access);
  window.localStorage.setItem("ac_refresh", refresh);
}

export function clearTokens() {
  window.localStorage.removeItem("ac_access");
  window.localStorage.removeItem("ac_refresh");
}

async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail =
      data?.detail ||
      data?.stage_name?.[0] ||
      (typeof data === "object" && data
        ? Object.values(data).flat().join(" ")
        : "Request failed");
    throw new ApiError(String(detail), res.status);
  }
  return data as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/api/v1/health"),
  lookups: () => request<Lookups>("/api/v1/lookups"),
  artists: (params: Record<string, string | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return request<Paginated<Artist>>(`/api/v1/artists${suffix}`);
  },
  artist: (slug: string) => request<Artist>(`/api/v1/artists/${slug}`),
  requestOtp: (body: { email?: string; phone?: string; purpose: "login" | "signup" }) =>
    request<{ ok: boolean; dev_code?: string; expires_in: number }>("/api/v1/auth/otp/request", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyOtp: (body: {
    email?: string;
    phone?: string;
    purpose: "login" | "signup";
    code: string;
  }) =>
    request<{ access: string; refresh: string; user: User; is_new: boolean }>(
      "/api/v1/auth/otp/verify",
      { method: "POST", body: JSON.stringify(body) },
    ),
  me: () => request<User>("/api/v1/auth/me", {}, true),
  getMyProfile: () => request<Artist>("/api/v1/me/profile", {}, true),
  saveMyProfile: (body: Record<string, unknown>) =>
    request<Artist>("/api/v1/me/profile", { method: "PATCH", body: JSON.stringify(body) }, true),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<Artist>("/api/v1/me/profile/image", { method: "POST", body: form }, true);
  },
};
