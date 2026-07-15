import type { NodeEnv } from '@Hashibutogarasu/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: NodeEnv;
      NEXT_PUBLIC_ACCOUNTS_URL: string;
      FIREBASE_ADMIN_PROJECT_ID: string;
      FIREBASE_ADMIN_CLIENT_EMAIL: string;
      FIREBASE_ADMIN_PRIVATE_KEY: string;
    }
  }
}

export {};
