/**
 * Identifies which credential type authenticated a request.
 */
export type RouteAuthMethod = 'apiKey' | 'oauthApp';

/**
 * Authentication result attached to a request once a guard has verified it.
 */
export interface RouteAuthContext {
  userId: string;
  authMethod: RouteAuthMethod;
  /** Granted OAuth scopes (e.g. `"read:profile"`). `null` for API keys, which are unscoped. */
  scopes: string[] | null;
}

/**
 * Verifies raw bearer tokens against their backing store.
 * Implemented by the consuming app so `packages/utils` stays database-agnostic.
 */
export interface TokenValidator {
  validateApiKey(token: string): Promise<{ userId: string } | null>;
  validateOauthToken(token: string): Promise<{ userId: string; scopes: string[] } | null>;
}

/**
 * Dependencies injected by the consuming app to bind the route guards
 * to its own token storage and routing conventions.
 */
export interface RouteAuthDeps {
  validator: TokenValidator;
  /** Derives the permission section key for a request, e.g. from its pathname. */
  deriveSectionKey: (request: Request) => string;
}

type RouteHandlerArgs = [request: Request, ctx: unknown];

export type GuardedRouteHandler<TArgs extends RouteHandlerArgs = RouteHandlerArgs> = (
  ...args: [...TArgs, auth: RouteAuthContext]
) => Promise<Response> | Response;

export type RouteHandler<TArgs extends RouteHandlerArgs = RouteHandlerArgs> = (...args: TArgs) => Promise<Response> | Response;

interface RouteGuardMeta {
  allowApiKey: boolean;
  allowOauthApp: boolean;
  permission: { mode: 'read' | 'write'; sectionKey?: string } | null;
}

interface WrappedRouteHandler<TArgs extends RouteHandlerArgs> extends RouteHandler<TArgs> {
  __routeGuardMeta: RouteGuardMeta;
  __innerHandler: GuardedRouteHandler<TArgs>;
}

function isWrapped<TArgs extends RouteHandlerArgs>(handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>): handler is WrappedRouteHandler<TArgs> {
  return '__routeGuardMeta' in handler;
}

function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

function insufficientScope(): Response {
  return Response.json({ error: 'insufficient_scope' }, { status: 403 });
}

/**
 * Returns route guard decorators bound to the given token validator and
 * section-key derivation strategy.
 *
 * Mirrors the dependency-injection shape used elsewhere in this package —
 * the consuming app supplies the storage-backed implementations so this
 * package never depends on a database client directly.
 *
 * `APIKeyRoute`, `OauthAppRoute`, `Read`, and `Write` may be composed in any
 * order (e.g. `APIKeyRoute()(OauthAppRoute()(Read()(handler)))`). Each call
 * only records intent on a metadata object shared by the wrapped handler;
 * the underlying wrapper performs authentication and permission checks
 * exactly once, after every decorator has been applied.
 */
export function createRouteAuth(deps: RouteAuthDeps) {
  function ensureWrapped<TArgs extends RouteHandlerArgs>(handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>): WrappedRouteHandler<TArgs> {
    if (isWrapped(handler)) return handler;

    const meta: RouteGuardMeta = { allowApiKey: false, allowOauthApp: false, permission: null };
    const inner = handler as GuardedRouteHandler<TArgs>;

    const wrapped = (async (...args: TArgs) => {
      const [request] = args;
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) return unauthorized();

      const token = authHeader.slice(7);
      if (!token) return unauthorized();

      let auth: RouteAuthContext | null = null;

      if (meta.allowApiKey) {
        const apiKeyResult = await deps.validator.validateApiKey(token);
        if (apiKeyResult) {
          auth = { userId: apiKeyResult.userId, authMethod: 'apiKey', scopes: null };
        }
      }

      if (!auth && meta.allowOauthApp) {
        const oauthResult = await deps.validator.validateOauthToken(token);
        if (oauthResult) {
          auth = {
            userId: oauthResult.userId,
            authMethod: 'oauthApp',
            scopes: oauthResult.scopes,
          };
        }
      }

      if (!auth) return unauthorized();

      if (meta.permission && auth.authMethod === 'oauthApp') {
        const sectionKey = meta.permission.sectionKey ?? deps.deriveSectionKey(request);
        const requiredScope = `${meta.permission.mode}:${sectionKey}`;
        if (!auth.scopes?.includes(requiredScope)) return insufficientScope();
      }

      return inner(...args, auth);
    }) as WrappedRouteHandler<TArgs>;

    wrapped.__routeGuardMeta = meta;
    wrapped.__innerHandler = inner;
    return wrapped;
  }

  function APIKeyRoute<TArgs extends RouteHandlerArgs = RouteHandlerArgs>() {
    return (handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>) => {
      const wrapped = ensureWrapped(handler);
      wrapped.__routeGuardMeta.allowApiKey = true;
      return wrapped;
    };
  }

  function OauthAppRoute<TArgs extends RouteHandlerArgs = RouteHandlerArgs>() {
    return (handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>) => {
      const wrapped = ensureWrapped(handler);
      wrapped.__routeGuardMeta.allowOauthApp = true;
      return wrapped;
    };
  }

  function Read<TArgs extends RouteHandlerArgs = RouteHandlerArgs>(sectionKey?: string) {
    return (handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>) => {
      const wrapped = ensureWrapped(handler);
      wrapped.__routeGuardMeta.permission = { mode: 'read', sectionKey };
      return wrapped;
    };
  }

  function Write<TArgs extends RouteHandlerArgs = RouteHandlerArgs>(sectionKey?: string) {
    return (handler: RouteHandler<TArgs> | GuardedRouteHandler<TArgs>) => {
      const wrapped = ensureWrapped(handler);
      wrapped.__routeGuardMeta.permission = { mode: 'write', sectionKey };
      return wrapped;
    };
  }

  return { APIKeyRoute, OauthAppRoute, Read, Write };
}
