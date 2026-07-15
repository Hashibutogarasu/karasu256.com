'use server';

import { MissingEnvError } from './missing-env-error';

/**
 * Returns the main app's full origin URL from the server-only `ROOT_APP_URL`
 * environment variable of the calling app's own deployment (e.g.
 * `https://karasu256.com` in production, `http://localhost:3000` in local
 * development). Read verbatim — never derived from a bare domain name, so
 * the scheme is never guessed.
 *
 * @throws {MissingEnvError} when `ROOT_APP_URL` is unset.
 */
export async function getRootAppUrl(): Promise<string> {
  const rootAppUrl = process.env.ROOT_APP_URL;
  if (!rootAppUrl) throw new MissingEnvError('ROOT_APP_URL');
  return rootAppUrl;
}
