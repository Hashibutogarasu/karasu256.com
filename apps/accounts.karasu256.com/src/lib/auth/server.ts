import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { oauthProvider } from '@better-auth/oauth-provider';
import { jwt } from 'better-auth/plugins/jwt';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@Hashibutogarasu/db/client';
import * as schema from '@Hashibutogarasu/db/schema';
import { firebaseSessionBridgePlugin } from '@/lib/auth/firebase-bridge-plugin';
import { bridgeFirebaseSessionForSocialSignIn, syncProfileImageToFirebase } from '@/lib/auth/hooks';

/**
 * The single better-auth instance for the monorepo, hosted on
 * accounts.karasu256.com. Scoped to two responsibilities only: running the
 * Google/GitHub OAuth handshake for social sign-in/linking, and acting as
 * the OAuth 2.1 / OIDC authorization server for third-party apps. Firebase
 * Auth remains the source of truth for the site's own login/session.
 */
export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
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
      update: {
        after: syncProfileImageToFirebase,
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
  plugins: [
    jwt(),
    oauthProvider({
      loginPage: '/',
      consentPage: '/oauth/consent',
      scopes: ['openid', 'profile', 'email', 'offline_access', 'read:profile', 'write:profile'],
      allowDynamicClientRegistration: false,
      accessTokenExpiresIn: 15 * 60,
    }),
    firebaseSessionBridgePlugin(),
    nextCookies(),
  ],
});
