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

const secrets = Object.fromEntries(SECRET_NAMES.filter((name) => process.env[name]).map((name) => [name, process.env[name]]));

/**
 * Secrets are bound to this version only, so each branch's alias keeps its own
 * DATABASE_URL. They go through a private temp file so their values never
 * appear in the command line or the job log.
 */
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
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
