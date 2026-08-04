/**
 * Origem pública do site (sem barra final).
 * Cliente: usa window.location.origin.
 * Servidor: NEXT_PUBLIC_APP_URL ou request origin.
 */
export function getSiteOrigin(requestOrigin) {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (requestOrigin) return String(requestOrigin).replace(/\/$/, "");
  return "";
}

export function getAuthCallbackUrl(origin, nextPath) {
  const base = origin || getSiteOrigin("");
  const qs =
    nextPath && String(nextPath).startsWith("/") && !String(nextPath).startsWith("//")
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";
  if (!base) return `/auth/callback${qs}`;
  return `${base}/auth/callback${qs}`;
}
