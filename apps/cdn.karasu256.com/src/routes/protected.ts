import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { isAllowedOrigin } from '../lib/cors';
import { checkGlobalRateLimit } from '../lib/global-rate-limit';
import { uploadRoute } from './upload';
import { uploadTicketRoute } from './upload-ticket';
import { anonymousUploadRoute } from './anonymous-upload';
import { challengeTokenRoute } from './challenge-token';
import { deleteRoute } from './delete';

export const protectedRoutes = (env: Env) =>
  new Elysia()
    .use(
      cors({
        origin: isAllowedOrigin,
        credentials: true,
        methods: ['POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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
    .use(uploadTicketRoute(env))
    .use(anonymousUploadRoute(env))
    .use(challengeTokenRoute(env))
    .use(deleteRoute(env));
