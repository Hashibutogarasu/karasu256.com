import { API_URL_ENV_KEY, findBranchApiUrlEnv, findLatestBranchDeployment, requireEnv, vercel } from './vercel-api.mjs';

const [branch, apiUrl] = process.argv.slice(2);
if (!branch || !apiUrl) {
  console.error('Usage: node sync-vercel-branch-api-url.mjs <branch> <api-url>');
  process.exit(1);
}
const { VERCEL_PROJECT_IDS } = requireEnv('VERCEL_PROJECT_IDS');

/** Env changes only apply to new deployments, so the branch preview is redeployed to pick the value up. */
async function redeployLatest(projectId) {
  const deployment = await findLatestBranchDeployment(projectId, branch);
  if (!deployment) return;
  await vercel('POST', '/v13/deployments', { name: deployment.name, deploymentId: deployment.uid, target: 'preview' });
  console.log(`Redeployed ${deployment.name} for ${branch}`);
}

/** Skipping unchanged values keeps the accounts redeploy from re-triggering the preview workflow in a loop. */
async function sync(projectId) {
  const existing = await findBranchApiUrlEnv(projectId, branch);
  if (existing) {
    const { value } = await vercel('GET', `/v1/projects/${projectId}/env/${existing.id}`);
    if (value === apiUrl) {
      console.log(`${projectId}: ${API_URL_ENV_KEY} for ${branch} is already up to date`);
      return;
    }
  }
  await vercel('POST', `/v10/projects/${projectId}/env?upsert=true`, {
    key: API_URL_ENV_KEY,
    value: apiUrl,
    type: 'encrypted',
    target: ['preview'],
    gitBranch: branch,
  });
  console.log(`${projectId}: set ${API_URL_ENV_KEY} for ${branch}`);
  await redeployLatest(projectId);
}

for (const projectId of VERCEL_PROJECT_IDS.split(',')) {
  await sync(projectId);
}
