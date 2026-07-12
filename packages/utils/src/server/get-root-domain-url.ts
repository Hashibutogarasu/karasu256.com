'use server';

import { MissingEnvError } from './missing-env-error';

/**
 * Derives the main app's origin from the server-only `ROOT_DOMAIN`
 * environment variable of the calling app's own deployment.
 *
 * @throws {MissingEnvError} when `ROOT_DOMAIN` is unset.
 */
export async function getRootDomainUrl(): Promise<string> {
  const rootDomain = process.env.ROOT_DOMAIN;
  if (!rootDomain) throw new MissingEnvError('ROOT_DOMAIN');
  return `https://${rootDomain}`;
}
