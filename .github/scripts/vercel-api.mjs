const API_URL_ENV_KEY = 'API_URL';

/** Fails fast when a required variable is missing, so a misconfigured workflow never calls Vercel half-configured. */
export function requireEnv(...names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

export async function vercel(method, path, body) {
  const { VERCEL_TOKEN, VERCEL_ORG_ID } = requireEnv('VERCEL_TOKEN', 'VERCEL_ORG_ID');
  const url = new URL(path, 'https://api.vercel.com');
  url.searchParams.set('teamId', VERCEL_ORG_ID);
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Vercel API ${method} ${url.pathname} responded ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

export async function findLatestBranchDeployment(projectId, branch) {
  const { deployments } = await vercel('GET', `/v6/deployments?projectId=${projectId}&target=preview&branch=${encodeURIComponent(branch)}&limit=1`);
  return deployments[0] ?? null;
}

export async function findBranchApiUrlEnv(projectId, branch) {
  const { envs } = await vercel('GET', `/v10/projects/${projectId}/env?gitBranch=${encodeURIComponent(branch)}`);
  return envs.find((env) => env.key === API_URL_ENV_KEY && env.gitBranch === branch && env.target?.includes('preview')) ?? null;
}

export { API_URL_ENV_KEY };
