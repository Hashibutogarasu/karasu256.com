import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';

/** The alias and worker name share one DNS label (`<alias>-<worker>`), which is capped at 63 characters. */
const MAX_LABEL_LENGTH = 63;
const HASH_LENGTH = 8;

/**
 * Derives a stable preview alias from a git branch, so every push of a branch
 * updates the same preview URL on the shared branch-preview worker.
 */
export function previewAliasForBranch(branch, workerName) {
  const maxLength = MAX_LABEL_LENGTH - workerName.length - 1;
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const alias = /^[a-z]/.test(slug) ? slug : `b-${slug}`;
  if (alias.length <= maxLength) return alias;

  const hash = createHash('sha256').update(branch).digest('hex').slice(0, HASH_LENGTH);
  const head = alias.slice(0, maxLength - HASH_LENGTH - 1).replace(/-$/, '');
  return `${head}-${hash}`;
}

const [branch, workerName] = process.argv.slice(2);
if (!branch || !workerName) {
  console.error('Usage: node api-preview-alias.mjs <branch> <worker-name>');
  process.exit(1);
}

const alias = previewAliasForBranch(branch, workerName);
console.log(alias);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `alias=${alias}\n`);
