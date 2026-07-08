import { Elysia } from 'elysia';
import { serveImage } from '../lib/images';

export const publicRoutes = (env: Env) => new Elysia().get('/*', ({ path }) => serveImage(path, env));
