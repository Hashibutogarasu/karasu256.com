import { getServerConfig } from "@/lib/config";

/** Lifetime of the session cookie: 14 days in milliseconds. */
export const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000;

/** Name of the session cookie shared across (sub)domains. */
export const SESSION_COOKIE_NAME = "session";

/**
 * Builds `ResponseCookie` options for setting the session cookie.
 *
 * Cookie domain is read from the validated server config so all
 * subdomain-sharing behaviour is governed by a single source.
 */
export function buildSetCookieOptions(value: string) {
  const { baseDomain } = getServerConfig();
  return {
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: baseDomain ? `.${baseDomain}` : undefined,
    maxAge: SESSION_DURATION_MS / 1000,
  };
}

/**
 * Builds `ResponseCookie` options for clearing the session cookie.
 *
 * Must match the same `Domain` and `Path` attributes used when setting,
 * otherwise browsers will not remove the cookie.
 */
export function buildClearCookieOptions() {
  const { baseDomain } = getServerConfig();
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: baseDomain ? `.${baseDomain}` : undefined,
    maxAge: 0,
  };
}
