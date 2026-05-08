const TOKEN_KEY = "zoro_auth_token";
const ROLE_KEY = "zoro_user_role";

export function persistSession(token: string, role?: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; samesite=lax`;

  if (role) {
    localStorage.setItem(ROLE_KEY, role);
    document.cookie = `${ROLE_KEY}=${role}; path=/; max-age=604800; samesite=lax`;
  }
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${ROLE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function getStoredRole(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ROLE_KEY);
}

export function hasStoredSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(localStorage.getItem(TOKEN_KEY));
}
