import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SECRET_NAMES = ['DATABASE_URL', 'INTERNAL_API_SECRET', 'VERCEL_PROTECTION_BYPASS_SECRET'];

const [workerName, alias, branch] = process.argv.slice(2);
if (!workerName || !alias || !branch) {
  console.error('Usage: node api-upload-preview.mjs <worker-name> <alias> <branch>');
  process.exit(1);
}

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID } = process.env;
if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
  process.exit(1);
}

async function workerExists() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${workerName}/settings`, {
    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
  });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Cloudflare API responded ${res.status}`);
  return true;
}

/** Deploys the shared preview worker on first use, since `versions upload` refuses to create a Worker. */
async function ensureWorker() {
  if (await workerExists()) return;
  const deploy = spawnSync('pnpm', ['exec', 'wrangler', 'deploy', '--name', workerName], { stdio: 'inherit' });
  if (deploy.status !== 0) process.exit(deploy.status ?? 1);
}

/**
 * Uploads a version under the branch's preview alias with secrets scoped to that version, passed through a private
 * temp file so their values never appear in the command line or the job log.
 */
function uploadVersion() {
  const secrets = Object.fromEntries(SECRET_NAMES.filter((name) => process.env[name]).map((name) => [name, process.env[name]]));
  const dir = mkdtempSync(join(process.env.RUNNER_TEMP ?? tmpdir(), 'api-preview-'));
  const secretsFile = join(dir, 'secrets.json');
  try {
    writeFileSync(secretsFile, JSON.stringify(secrets), { mode: 0o600 });
    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'wrangler',
        'versions',
        'upload',
        '--name',
        workerName,
        '--preview-alias',
        alias,
        '--var',
        `GIT_BRANCH:${branch}`,
        '--secrets-file',
        secretsFile,
      ],
      { stdio: 'inherit' }
    );
    return result.status ?? 1;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

await ensureWorker();
process.exitCode = uploadVersion();
