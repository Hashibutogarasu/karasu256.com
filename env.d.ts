declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    SECRET_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_MICROCMS_API_KEY: string;
    NEXT_PUBLIC_MICROCMS_API_BASE_URL: string;
  }
}