import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

const webauthnSchema = z.object({
  rpId: z.string().min(1),
  rpName: z.string().min(1),
  expectedOrigins: z.array(z.string().url()).min(1),
});

const yamlSchema = z.object({
  development: z.object({ webauthn: webauthnSchema }),
  production: z.object({ webauthn: webauthnSchema }),
});

const envSchema = z.object({
  firebaseAdmin: z.object({
    projectId: z.string().min(1),
    clientEmail: z.string().email(),
    privateKey: z.string().min(1),
    databaseURL: z.string().url(),
  }),
  resend: z.object({
    apiKey: z.string().min(1),
    fromEmail: z.string().email(),
  }),
  baseDomain: z.string().optional(),
});

export type ServerConfig = {
  webauthn: z.infer<typeof webauthnSchema>;
  firebaseAdmin: z.infer<typeof envSchema>['firebaseAdmin'];
  resend: z.infer<typeof envSchema>['resend'];
  baseDomain?: string;
};

let cached: ServerConfig | undefined;

/**
 * Returns the validated server configuration, merging `config/app.yml`
 * (environment-keyed non-secrets) with server-only environment variables.
 * Result is cached for the lifetime of the Node.js process.
 *
 * @throws when the YAML file is missing or any required value fails validation.
 */
export function getServerConfig(): ServerConfig {
  if (cached !== undefined) return cached;

  const filePath = path.join(process.cwd(), 'config', 'app.yml');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const yamlData = yamlSchema.parse(parseYaml(raw));
  const envKey = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const { webauthn } = yamlData[envKey];

  const envData = envSchema.parse({
    firebaseAdmin: {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL,
    },
    baseDomain: process.env.BASE_DOMAIN,
  });

  cached = { webauthn, ...envData };
  return cached;
}
