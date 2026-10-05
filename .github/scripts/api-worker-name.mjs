import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';

const PREFIX = 'api-karasu256-com-';
const MAX_NAME_LENGTH = 63;
const HASH_LENGTH = 8;

/**
 * Derives a stable worker name from a git branch, so the deploy and cleanup
 * workflows always agree on which worker belongs to which branch.
 */
export function workerNameForBranch(branch) {
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const name = `${PREFIX}${slug}`;
  if (name.length <= MAX_NAME_LENGTH) return name;

  const hash = createHash('sha256').update(branch).digest('hex').slice(0, HASH_LENGTH);
  const head = name.slice(0, MAX_NAME_LENGTH - HASH_LENGTH - 1).replace(/-$/, '');
  return `${head}-${hash}`;
}

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: node api-worker-name.mjs <branch>');
  process.exit(1);
}

const name = workerNameForBranch(branch);
console.log(name);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `name=${name}\n`);
