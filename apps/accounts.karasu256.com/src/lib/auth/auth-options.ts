import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { getDb } from '@Hashibutogarasu/db/client';
import * as schema from '@Hashibutogarasu/db/schema';
import { bridgeFirebaseSessionForSocialSignIn, provisionFirebaseUser, syncNewUserToNeonAuth, syncProfileToFirebase } from '@/lib/auth/hooks';

/**
 * Shared better-auth configuration (everything except `plugins`), used by
 * both the production instance (`server.ts`) and the test-only instance
 * (`server.test.ts`, which additionally includes the `testUtils` plugin).
 * Keeping this in one place prevents the two instances from drifting apart.
 */
export const authOptions = {
  database: drizzleAdapter(getDb(), {
    provider: 'pg' as const,
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      jwks: schema.jwks,
      oauthClient: schema.oauthClients,
      oauthRefreshToken: schema.oauthRefreshTokens,
      oauthAccessToken: schema.oauthAccessTokens,
      oauthConsent: schema.oauthConsents,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.BETTER_AUTH_URL, process.env.NEXT_PUBLIC_APP_URL].filter((v): v is string => !!v),
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
      allowDifferentEmails: true,
      updateUserInfoOnLink: true,
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.BASE_DOMAIN,
    },
  },
  hooks: {
    after: bridgeFirebaseSessionForSocialSignIn,
  },
  databaseHooks: {
    user: {
      create: {
        before: provisionFirebaseUser,
        after: syncNewUserToNeonAuth,
      },
      update: {
        after: syncProfileToFirebase,
      },
    },
  },
  onAPIError: {
    errorURL: '/oauth/error',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disableImplicitSignUp: true,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      disableImplicitSignUp: true,
    },
  },
  disabledPaths: ['/token'],
};
