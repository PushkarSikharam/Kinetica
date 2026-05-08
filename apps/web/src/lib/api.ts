export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type AuthFetchOptions = RequestInit & {
  token?: string | null;
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("zoro_auth_token");
}

export async function apiFetch(path: string, options: AuthFetchOptions = {}) {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = text;

    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail ?? parsed.message ?? text;
    } catch {
      // Keep raw response text.
    }

    throw new Error(detail || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
