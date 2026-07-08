import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { env } from 'cloudflare:workers';
import { publicRoutes } from './routes/serve';
import { protectedRoutes } from './routes/protected';

export default new Elysia({ adapter: CloudflareAdapter }).use(publicRoutes(env)).use(protectedRoutes(env)).compile();
