import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SIGNATURE_HEADER = 'x-signature';
export const SIGNATURE_TIMESTAMP_HEADER = 'x-signature-timestamp';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const KEY_LABEL = 'auth-request-signature:v1';

export interface SignRequestInput {
  secret: string;
  method: string;
  url: string;
  body?: string;
  timestamp?: number;
}

export interface VerifyRequestInput {
  secret: string;
  method: string;
  url: string;
  headers: Headers;
  body: string;
  now?: number;
}

export type VerifyRequestResult = { status: 'unsigned' } | { status: 'invalid' } | { status: 'valid' };

function deriveKey(secret: string): Buffer {
  return createHmac('sha256', secret).update(KEY_LABEL).digest();
}

function canonicalize(method: string, url: string, timestamp: string, body: string): string {
  const { pathname, search } = new URL(url);
  const bodyHash = createHash('sha256').update(body).digest('hex');
  return [method.toUpperCase(), `${pathname}${search}`, timestamp, bodyHash].join('\n');
}

function computeSignature(secret: string, canonical: string): string {
  return createHmac('sha256', deriveKey(secret)).update(canonical).digest('base64url');
}

export function signRequest({ secret, method, url, body = '', timestamp = Date.now() }: SignRequestInput): Record<string, string> {
  const ts = String(timestamp);
  return {
    [SIGNATURE_TIMESTAMP_HEADER]: ts,
    [SIGNATURE_HEADER]: computeSignature(secret, canonicalize(method, url, ts, body)),
  };
}

export function verifyRequest({ secret, method, url, headers, body, now = Date.now() }: VerifyRequestInput): VerifyRequestResult {
  const signature = headers.get(SIGNATURE_HEADER);
  const timestamp = headers.get(SIGNATURE_TIMESTAMP_HEADER);
  if (signature === null && timestamp === null) return { status: 'unsigned' };
  if (!signature || !timestamp || !/^\d+$/.test(timestamp)) return { status: 'invalid' };
  if (Math.abs(now - Number(timestamp)) > MAX_CLOCK_SKEW_MS) return { status: 'invalid' };

  const expected = Buffer.from(computeSignature(secret, canonicalize(method, url, timestamp, body)));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return { status: 'invalid' };

  return { status: 'valid' };
}
