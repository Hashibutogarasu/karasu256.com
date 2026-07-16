import type { ReactNode } from 'react';
import { createClient } from '@vercel/edge-config';
import type { z } from 'zod';
import { FeatureFlagsClientProvider } from '../client/feature-flags-context';

export interface FeatureFlagsProviderProps<TSchema extends z.ZodType> {
  /**
   * Vercel Edge Config connection string, resolved server-side via
   * `getEdgeConfig()` and passed down as a plain string so this
   * component's props stay serializable across the Server Component
   * boundary.
   */
  edgeConfig: string;
  /** Zod schema validating the Edge Config item set for this app's flags. */
  schema: TSchema;
  children: ReactNode;
}

/**
 * Fetches this app's full Edge Config item set and validates it against
 * `schema` on every render — Edge Config's own client already performs a
 * fresh network call each time, so there is no separate cache to
 * invalidate. When the fetch fails or the result does not match `schema`,
 * the flags could not be resolved — `useFeatureFlags()` returns `null` in
 * that case rather than throwing.
 */
export async function FeatureFlagsProvider<TSchema extends z.ZodType>({ edgeConfig, schema, children }: FeatureFlagsProviderProps<TSchema>) {
  const client = createClient(edgeConfig);
  let flags: Record<string, unknown> | null;
  try {
    const items = await client.getAll();
    flags = schema.parse(items) as Record<string, unknown>;
  } catch {
    flags = null;
  }
  return <FeatureFlagsClientProvider flags={flags}>{children}</FeatureFlagsClientProvider>;
}
