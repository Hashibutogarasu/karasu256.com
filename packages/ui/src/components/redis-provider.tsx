import type { ReactNode } from 'react';
import { Redis } from 'ioredis';

/**
 * ioredis opens a raw TCP socket and cannot run in the browser, and React
 * Server Components do not support Context Providers or `useContext` (only
 * Client Components can consume a Context). `RedisProvider` therefore cannot
 * follow the `React.createContext` pattern used by `R2StorageProvider`.
 *
 * Instead, `RedisProvider` is a Server Component that renders its children
 * unchanged, registering the supplied `redisURL` in module scope. `useRedis()`
 * lazily creates a connection-reusing singleton client from that registered
 * URL. This module must never be imported from a Client Component: ioredis
 * is a Node.js-only package and has no browser build.
 */
export interface RedisProviderProps {
  /** Full Redis connection string, e.g. `redis://default:password@host:6379`. Server-only. */
  redisURL: string;
  children: ReactNode;
}

let registeredRedisURL: string | undefined;
let client: Redis | undefined;

/** Registers the Redis connection URL for `useRedis()` and renders children unchanged. */
export function RedisProvider({ redisURL, children }: RedisProviderProps): ReactNode {
  registeredRedisURL = redisURL;
  return children;
}

export interface UseRedisResult {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
}

/**
 * Returns a lazily-created, connection-reusing Redis client backed by the
 * URL supplied to the nearest `RedisProvider`. Must only be called from
 * server code (Route Handlers, Server Components, Server Actions) — never
 * from a Client Component, since ioredis cannot run in the browser.
 */
export function useRedis(): UseRedisResult {
  if (!registeredRedisURL) {
    throw new Error('useRedis must be called within a RedisProvider tree');
  }
  if (!client) {
    client = new Redis(registeredRedisURL);
  }
  const activeClient = client;

  return {
    get: (key) => activeClient.get(key),
    set: async (key, value, ttlSeconds) => {
      if (ttlSeconds) {
        await activeClient.set(key, value, 'EX', ttlSeconds);
      } else {
        await activeClient.set(key, value);
      }
    },
    del: async (key) => {
      await activeClient.del(key);
    },
  };
}
