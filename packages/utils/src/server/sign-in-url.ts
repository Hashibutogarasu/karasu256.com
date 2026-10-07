import { headers } from 'next/headers';
import { MissingEnvError } from './missing-env-error';

export async function getSignInUrl(authUrl: string | undefined, path = '/'): Promise<string> {
  if (!authUrl) throw new MissingEnvError('NEXT_PUBLIC_AUTH_URL');
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const proto = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const url = new URL('/sign-in', authUrl);
  if (host) url.searchParams.set('redirectTo', new URL(path, `${proto}://${host}`).toString());
  return url.toString();
}
