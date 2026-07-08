import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { isAllowedOrigin } from '../lib/cors';
import { checkGlobalRateLimit } from '../lib/global-rate-limit';
import { uploadRoute } from './upload';
import { anonymousUploadRoute } from './anonymous-upload';
import { deleteRoute } from './delete';

export const protectedRoutes = (env: Env) =>
  new Elysia()
    .use(
      cors({
        origin: isAllowedOrigin,
        credentials: true,
        methods: ['POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
      })
    )
    .onRequest(({ request, set }) => {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const { allowed, retryAfterSeconds } = checkGlobalRateLimit(ip);
      if (!allowed) {
        set.status = 429;
        set.headers['Retry-After'] = String(retryAfterSeconds);
        return { error: 'Too many requests' };
      }
    })
    .use(uploadRoute(env))
    .use(anonymousUploadRoute(env))
    .use(deleteRoute(env));
