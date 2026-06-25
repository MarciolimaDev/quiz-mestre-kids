function apiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  // In production default to same-origin `/api` so cookie-based auth works
  // when using Vercel rewrites. To override explicitly set NEXT_PUBLIC_API_URL.
  if (process.env.NODE_ENV === "production") return "/api";
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return "http://localhost:8000/api";
}

function errorMessage(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.map(errorMessage).join(" ");
  if (data && typeof data === "object") return Object.values(data).map(errorMessage).join(" ");
  return "Não foi possível concluir a operação.";
}

export async function apiFetch<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  path = path.startsWith("/") ? path : `/${path}`;
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (!isFormData) headers["Content-Type"] = "application/json";
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await fetch(`${apiBaseUrl()}/auth/refresh/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (refreshed.ok) return apiFetch<T>(path, init, false);
    if (typeof window !== "undefined") window.location.assign("/login");
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    throw new Error(errorMessage(data));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
