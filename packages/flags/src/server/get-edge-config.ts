'use server';

import { MissingEnvError } from './missing-env-error';

/**
 * Returns this app's own Vercel Edge Config connection string from the
 * server-only `EDGE_CONFIG` environment variable, read verbatim.
 *
 * @throws {MissingEnvError} when `EDGE_CONFIG` is unset.
 */
export async function getEdgeConfig(): Promise<string> {
  const edgeConfig = process.env.EDGE_CONFIG;
  if (!edgeConfig) throw new MissingEnvError('EDGE_CONFIG');
  return edgeConfig;
}
