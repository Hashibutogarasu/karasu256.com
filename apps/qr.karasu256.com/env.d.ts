import type { NodeEnv } from '@Hashibutogarasu/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: NodeEnv;
      NEXT_PUBLIC_ACCOUNTS_URL: string;
      NEXT_PUBLIC_IMAGE_API_URL: string;
      /**
       * Server-only base URL of the image API Worker, used by code that
       * never runs in the browser (see `qr.ts`'s `getImageApiUrl`). Points
       * at the same Worker as `NEXT_PUBLIC_IMAGE_API_URL` for a given
       * environment, but kept as a separate variable: `NEXT_PUBLIC_*`
       * variables are inlined into the bundle at build time, so reusing
       * that one here risks baking in a stale value if the build doesn't
       * pick up an environment-specific change.
       */
      CDN_URL: string;
      FIREBASE_ADMIN_PROJECT_ID: string;
      FIREBASE_ADMIN_CLIENT_EMAIL: string;
      FIREBASE_ADMIN_PRIVATE_KEY: string;
    }
  }
}

export {};
