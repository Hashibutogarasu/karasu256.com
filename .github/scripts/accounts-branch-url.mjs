import { appendFileSync } from 'node:fs';
import { findLatestBranchDeployment, requireEnv, vercel } from './vercel-api.mjs';

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: node accounts-branch-url.mjs <branch>');
  process.exit(1);
}
const { VERCEL_PROJECT_ID_ACCOUNTS } = requireEnv('VERCEL_PROJECT_ID_ACCOUNTS');
const { GITHUB_OUTPUT } = process.env;

/** Vercel truncates and hashes long branch aliases, so the alias is read back from a deployment instead of derived from the name. */
const latest = await findLatestBranchDeployment(VERCEL_PROJECT_ID_ACCOUNTS, branch);
const deployment = latest ? await vercel('GET', `/v13/deployments/${latest.uid}`) : null;
const branchAlias = deployment?.alias?.find((alias) => alias.includes('-git-'));

/** Not finding one is expected right after a push; the accounts deployment_status event deploys the worker once it exists. */
if (!branchAlias) {
  console.log(`No accounts.karasu256.com preview with a branch alias exists yet for ${branch}`);
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, 'found=false\n');
  process.exit(0);
}

const url = `https://${branchAlias}`;
console.log(url);
if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `found=true\nurl=${url}\n`);
