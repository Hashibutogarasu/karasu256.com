declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    SECRET_KEY: string;
    NODE_ENV: "development" | "production" | "test";
    NEXT_PUBLIC_MICROCMS_API_KEY: string;
    NEXT_PUBLIC_MICROCMS_API_BASE_URL: string;
    FIREBASE_ADMIN_PROJECT_ID: string;
    FIREBASE_ADMIN_CLIENT_EMAIL: string;
    FIREBASE_ADMIN_PRIVATE_KEY: string;
    NEXT_PUBLIC_ACCOUNTS_URL: string;
  }
}
