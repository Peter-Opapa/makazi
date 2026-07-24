export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "makazi_access_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------- Admin/staff: our own JWT, stored in localStorage ----------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// ---------- Landlord/Caretaker/Tenant: Clerk session token ----------
// Fed by <ClerkTokenBridge/> (rendered once in the root layout, inside
// <ClerkProvider>) via useAuth()'s getToken — Clerk's own documented pattern
// for attaching auth to calls to a separate backend. Centralized here as a
// module-level getter so apiFetch can stay a plain function used all over
// lib/*.ts, rather than every call site needing to be a React hook.
type ClerkTokenGetter = () => Promise<string | null>;
let clerkTokenGetter: ClerkTokenGetter | null = null;

export function setClerkTokenGetter(getter: ClerkTokenGetter | null) {
  clerkTokenGetter = getter;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const clerkToken = clerkTokenGetter ? await clerkTokenGetter() : null;
  const token = clerkToken ?? getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    credentials: "include",
  });

  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    if (!window.location.pathname.startsWith("/session-expired")) {
      window.location.href = "/session-expired";
    }
  }

  if (!res.ok) {
    const body = await res.text();
    let message = body || res.statusText;
    try {
      const parsed = JSON.parse(body);
      message = Array.isArray(parsed?.message) ? parsed.message.join(", ") : parsed?.message ?? message;
    } catch {
      // body wasn't JSON — fall back to raw text/statusText above
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
