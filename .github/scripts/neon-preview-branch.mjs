import { appendFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const { NEON_API_KEY, NEON_PROJECT_ID, GITHUB_OUTPUT } = process.env;
const [branchName, parentName = 'main', databaseName = 'neondb', roleName = 'neondb_owner'] = process.argv.slice(2);

if (!branchName || !NEON_API_KEY || !NEON_PROJECT_ID) {
  console.error('Usage: NEON_API_KEY=… NEON_PROJECT_ID=… node neon-preview-branch.mjs <branch> [parent] [database] [role]');
  process.exit(1);
}

const API = `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}`;
const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 5000;

/**
 * Calls the Neon API, retrying while the project is locked by another operation (409/423), which happens when the
 * Vercel integration is creating the same preview branch for this push.
 */
async function neon(path, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${NEON_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    });
    if (res.ok) return res.json();
    if ((res.status !== 409 && res.status !== 423) || attempt === MAX_ATTEMPTS) {
      throw new Error(`Neon API ${init.method ?? 'GET'} ${path} responded ${res.status}: ${await res.text()}`);
    }
    console.log(`Neon API responded ${res.status}; retrying in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_ATTEMPTS})`);
    await sleep(RETRY_DELAY_MS);
  }
}

async function findBranch(name) {
  const { branches } = await neon(`/branches?search=${encodeURIComponent(name)}`);
  return branches.find((branch) => branch.name === name) ?? null;
}

/** Returns the preview branch, creating it from the parent only when neither this job nor the Vercel integration has. */
async function ensureBranch() {
  const existing = await findBranch(branchName);
  if (existing) return existing;

  const parent = await findBranch(parentName);
  if (!parent) throw new Error(`Parent branch ${parentName} not found`);
  try {
    const { branch } = await neon('/branches', {
      method: 'POST',
      body: JSON.stringify({ branch: { name: branchName, parent_id: parent.id }, endpoints: [{ type: 'read_write' }] }),
    });
    return branch;
  } catch (error) {
    const created = await findBranch(branchName);
    if (created) return created;
    throw error;
  }
}

const branch = await ensureBranch();
const query = new URLSearchParams({ branch_id: branch.id, database_name: databaseName, role_name: roleName, pooled: 'true' });
const { uri } = await neon(`/connection_uri?${query}`);

console.log(`::add-mask::${uri}`);
console.log(`Using Neon branch ${branch.name} (${branch.id})`);
if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `branch_id=${branch.id}\ndb_url_pooled=${uri}\n`);
