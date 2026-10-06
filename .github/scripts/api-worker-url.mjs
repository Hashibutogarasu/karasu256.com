import { appendFileSync } from 'node:fs';

const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
const [workerName, alias] = process.argv.slice(2);

if (!workerName || !alias || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('Usage: CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node api-worker-url.mjs <worker-name> <alias>');
  process.exit(1);
}

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/workers/subdomain`, {
  headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
});
if (!res.ok) throw new Error(`Cloudflare API responded ${res.status}`);
const { result } = await res.json();

const url = `https://${alias}-${workerName}.${result.subdomain}.workers.dev`;
console.log(url);
if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `url=${url}\n`);
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `api.karasu256.com preview \`${alias}\` on \`${workerName}\`: ${url}\n`);
