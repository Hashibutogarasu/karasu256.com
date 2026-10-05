import { API_URL_ENV_KEY, findBranchApiUrlEnv, findLatestBranchDeployment, requireEnv, vercel } from './vercel-api.mjs';

const [branch, apiUrl] = process.argv.slice(2);
if (!branch || !apiUrl) {
  console.error('Usage: node sync-vercel-branch-api-url.mjs <branch> <api-url>');
  process.exit(1);
}
const { VERCEL_PROJECT_IDS } = requireEnv('VERCEL_PROJECT_IDS');

async function upsertApiUrl(projectId) {
  const existing = await findBranchApiUrlEnv(projectId, branch);
  if (existing) {
    const { value } = await vercel('GET', `/v1/projects/${projectId}/env/${existing.id}`);
    if (value === apiUrl) return existing.updatedAt;
  }
  await vercel('POST', `/v10/projects/${projectId}/env?upsert=true`, {
    key: API_URL_ENV_KEY,
    value: apiUrl,
    type: 'encrypted',
    target: ['preview'],
    gitBranch: branch,
  });
  console.log(`${projectId}: set ${API_URL_ENV_KEY} for ${branch}`);
  return Date.now();
}

/** Comparing against the deployment's age, not just the value, recovers a run that failed to redeploy without letting the redeploy re-trigger itself. */
async function sync(projectId) {
  const apiUrlUpdatedAt = await upsertApiUrl(projectId);
  const deployment = await findLatestBranchDeployment(projectId, branch);
  if (!deployment || deployment.created >= apiUrlUpdatedAt) {
    console.log(`${projectId}: preview for ${branch} already uses the current ${API_URL_ENV_KEY}`);
    return;
  }
  await vercel('POST', '/v13/deployments', { name: deployment.name, deploymentId: deployment.uid });
  console.log(`${projectId}: redeployed ${deployment.name} for ${branch}`);
}

for (const projectId of VERCEL_PROJECT_IDS.split(',')) {
  await sync(projectId);
}
