import { spawnSync } from 'node:child_process';

const SECRET_NAMES = ['DATABASE_URL', 'INTERNAL_API_SECRET', 'VERCEL_PROTECTION_BYPASS_SECRET'];

const workerName = process.argv[2];
if (!workerName) {
  console.error('Usage: node api-worker-secrets.mjs <worker-name>');
  process.exit(1);
}

const secrets = Object.fromEntries(SECRET_NAMES.filter((name) => process.env[name]).map((name) => [name, process.env[name]]));

/** Secrets go through stdin so their values never appear in the command line or the job log. */
const result = spawnSync('pnpm', ['exec', 'wrangler', 'secret', 'bulk', '--name', workerName], {
  input: JSON.stringify(secrets),
  stdio: ['pipe', 'inherit', 'inherit'],
});
process.exit(result.status ?? 1);
