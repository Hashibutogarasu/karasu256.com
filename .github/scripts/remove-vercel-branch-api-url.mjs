import { API_URL_ENV_KEY, findBranchApiUrlEnv, requireEnv, vercel } from './vercel-api.mjs';

const branch = process.argv[2];
if (!branch) {
  console.error('Usage: node remove-vercel-branch-api-url.mjs <branch>');
  process.exit(1);
}
const { VERCEL_PROJECT_IDS } = requireEnv('VERCEL_PROJECT_IDS');

for (const projectId of VERCEL_PROJECT_IDS.split(',')) {
  const existing = await findBranchApiUrlEnv(projectId, branch);
  if (!existing) continue;
  await vercel('DELETE', `/v9/projects/${projectId}/env/${existing.id}`);
  console.log(`${projectId}: removed ${API_URL_ENV_KEY} for ${branch}`);
}
