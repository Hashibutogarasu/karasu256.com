import type { OAuthProvider } from "./base";
import { GitHubProvider } from "./github";
import { GoogleProvider } from "./google";

export type { OAuthProvider, ProviderProfile, TokenSet } from "./base";

const registry = new Map<string, () => OAuthProvider>([
  ["google", () => new GoogleProvider()],
  ["github", () => new GitHubProvider()],
]);

/**
 * Returns the provider instance for the given ID, or null if unknown.
 * Instantiated lazily so missing env vars only throw at call time.
 */
export function getProvider(id: string): OAuthProvider | null {
  const factory = registry.get(id);
  return factory ? factory() : null;
}
