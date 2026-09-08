'use server';

import { MissingEnvError } from './missing-env-error';

/** `ROOT_APP_URL`'s fallback outside production, matching karasu256.com's own local dev port. */
const LOCAL_DEV_ROOT_APP_URL = 'http://localhost:3000';

/**
 * Returns the main app's full origin URL from the server-only `ROOT_APP_URL`
 * environment variable of the calling app's own deployment (e.g.
 * `https://karasu256.com` in production, `http://localhost:3000` in local
 * development). Read verbatim — never derived from a bare domain name, so
 * the scheme is never guessed.
 *
 * Outside production, an unset `ROOT_APP_URL` falls back to
 * {@link LOCAL_DEV_ROOT_APP_URL} so the app runs immediately after cloning
 * without requiring a `.env` file. In production this fallback never
 * applies, preserving the "never guessed" guarantee above.
 *
 * @throws {MissingEnvError} when `ROOT_APP_URL` is unset in production.
 */
export async function getRootAppUrl(): Promise<string> {
  const rootAppUrl = process.env.ROOT_APP_URL;
  if (rootAppUrl) return rootAppUrl;
  if (process.env.NODE_ENV !== 'production') return LOCAL_DEV_ROOT_APP_URL;
  throw new MissingEnvError('ROOT_APP_URL');
}
