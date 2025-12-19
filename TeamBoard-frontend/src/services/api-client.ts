import type { TokenPair } from "@/types/api";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const ACCESS_KEY = "teamboard_access";
const REFRESH_KEY = "teamboard_refresh";

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  auth?: boolean;
};

export const getStoredTokens = () => ({
  access: localStorage.getItem(ACCESS_KEY) ?? "",
  refresh: localStorage.getItem(REFRESH_KEY) ?? "",
});

export const setTokens = (tokens: TokenPair) => {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

const refreshAccessToken = async () => {
  const { refresh } = getStoredTokens();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { access: string };
  localStorage.setItem(ACCESS_KEY, data.access);
  return true;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  if (options.auth !== false) {
    const { access } = getStoredTokens();
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  const fetchOnce = () =>
    fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
    });

  let res = await fetchOnce();

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetchOnce();
    } else {
      clearTokens();
    }
  }

  if (!res.ok) {
    const errorText = await res.text();
    const message = extractErrorMessage(errorText);
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  if (!isJson) return null as T;
  if (res.status === 204) return null as T;
  const resp = (await res.json()) as unknown;
  if (resp && typeof resp === "object" && "data" in (resp as any)) {
    return (resp as any).data as T;
  }
  return resp as T;
};

const extractErrorMessage = (raw: string) => {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as any;
    if (parsed?.message && typeof parsed.message === "string") {
      return parsed.message;
    }
    if (parsed?.errors?.detail && typeof parsed.errors.detail === "string") {
      return parsed.errors.detail;
    }
    if (parsed?.detail && typeof parsed.detail === "string") {
      return parsed.detail;
    }
  } catch {
    // Non-JSON response; fall back to raw text.
  }
  return raw;
};
