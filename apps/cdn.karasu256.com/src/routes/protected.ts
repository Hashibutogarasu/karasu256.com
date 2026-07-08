import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { isAllowedOrigin } from '../lib/cors';
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
    .use(uploadRoute(env))
    .use(anonymousUploadRoute(env))
    .use(deleteRoute(env));
