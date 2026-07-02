/**
 * Scans API routes for `@Read`/`@Write`/`@APIKeyRoute`/`@OauthAppRoute`
 * route-guard usage and keeps two generated artifacts in sync. Any newly
 * discovered section key is appended to
 * `packages/db/src/permissions/section-bit-map.generated.ts` with the next
 * free bit position, without ever reassigning an existing key, and a
 * placeholder `permissions.sections.<key>.{label,description}` entry is
 * inserted into each of
 * `apps/karasu256.com/src/lib/i18n/locales/{en,ja,cn}/translation.json` for
 * any key missing a translation, without overwriting strings that are
 * already translated.
 *
 * Run with `--check` to verify the generated files are up to date without
 * writing changes (exits non-zero if they are stale); intended for CI.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Project, SyntaxKind, type CallExpression, type ObjectLiteralExpression } from "ts-morph";
import { createRouteAuth } from "@Hashibutogarasu/utils/server";

const require = createRequire(import.meta.url);

/** Every API route lives under `src/app/api` by Next.js App Router convention. */
const APP_ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(APP_ROOT, "src/app/api");
const DEFAULT_NAMESPACE = "translation";

/**
 * Resolved through Node's module resolution (honoring the workspace symlink
 * and `@Hashibutogarasu/db`'s own `package.json` exports) rather than a
 * hardcoded relative path, so this script keeps working if either package
 * moves within the monorepo.
 */
const dbPackageSrcDir = path.dirname(require.resolve("@Hashibutogarasu/db"));
const BIT_MAP_PATH = path.join(dbPackageSrcDir, "permissions/section-bit-map.generated.ts");

function getObjectProperty(obj: ObjectLiteralExpression, name: string) {
  return obj.getPropertyOrThrow(name).asKindOrThrow(SyntaxKind.PropertyAssignment).getInitializerOrThrow();
}

/**
 * Reads the locale list and translation output path template from this
 * app's own `i18next.config.ts` via static AST parsing (rather than
 * importing and executing it) so they can never drift out of sync with the
 * i18next-cli configuration, and never duplicate `["en", "ja", "cn"]` here.
 */
function readI18nConfig(project: Project): { locales: string[]; outputTemplate: string } {
  const configFile = project.addSourceFileAtPath(path.join(APP_ROOT, "i18next.config.ts"));
  const defineConfigCall = configFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => call.getExpression().getText() === "defineConfig");
  if (!defineConfigCall) throw new Error("Could not find defineConfig(...) in i18next.config.ts");

  const config = defineConfigCall.getArguments()[0].asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const locales = getObjectProperty(config, "locales")
    .asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
    .getElements()
    .map((el) => el.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue());
  const extract = getObjectProperty(config, "extract").asKindOrThrow(SyntaxKind.ObjectLiteralExpression);
  const outputTemplate = getObjectProperty(extract, "output")
    .asKindOrThrow(SyntaxKind.StringLiteral)
    .getLiteralValue();

  return { locales, outputTemplate };
}

function resolveLocalePaths(project: Project): Record<string, string> {
  const { locales, outputTemplate } = readI18nConfig(project);
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      path.join(
        APP_ROOT,
        outputTemplate.replace("{{language}}", locale).replace("{{namespace}}", DEFAULT_NAMESPACE),
      ),
    ]),
  );
}

/**
 * Derived from the actual `createRouteAuth` return value instead of a
 * hand-maintained string list, so renaming a decorator in
 * `packages/utils/src/server/route-guards.ts` can never silently desync
 * detection here. The stub dependencies are never invoked: `createRouteAuth`
 * only calls into them from the wrapped request handlers it returns, which
 * this script never executes.
 */
const GUARD_NAMES = new Set(
  Object.keys(
    createRouteAuth({
      validator: {
        validateApiKey: async () => null,
        validateOauthToken: async () => null,
      },
      permissionChecker: { hasPermission: () => false },
      deriveSectionKey: () => "",
    }),
  ),
);
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

interface RouteGuardUsage {
  file: string;
  exportName: string;
  guards: Set<string>;
  /** Section key from an explicit `Read("key")`/`Write("key")` argument, if any. */
  explicitKey: string | null;
}

/** Derives the section key for a route from its file path, matching the
 * runtime `deriveSectionKey` in `src/lib/api/route-auth.ts`. */
function deriveSectionKeyFromPath(routeFile: string): string {
  const relative = path.relative(API_DIR, routeFile);
  const segments = relative.split(path.sep).filter((s) => s !== "route.ts");
  return segments[0] ?? "";
}

function collectGuardCalls(call: CallExpression, into: Set<string>, keys: string[]): void {
  const expr = call.getExpression();
  if (expr.getKind() === SyntaxKind.Identifier) {
    const name = expr.getText();
    if (GUARD_NAMES.has(name)) {
      into.add(name);
      const arg = call.getArguments()[0];
      if (arg && arg.getKind() === SyntaxKind.StringLiteral) {
        keys.push(arg.getText().slice(1, -1));
      }
    }
  }
  for (const arg of call.getArguments()) {
    const nestedCalls = arg.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const nested of nestedCalls) collectGuardCalls(nested, into, keys);
  }
}

function findRouteGuardUsages(project: Project): RouteGuardUsage[] {
  const usages: RouteGuardUsage[] = [];

  for (const sourceFile of project.getSourceFiles(`${API_DIR}/**/route.ts`)) {
    for (const [exportName, declarations] of sourceFile.getExportedDeclarations()) {
      if (!HTTP_METHODS.has(exportName)) continue;

      for (const decl of declarations) {
        const calls = decl.getDescendantsOfKind
          ? [decl, ...decl.getDescendantsOfKind(SyntaxKind.CallExpression)]
          : [decl];
        const topCall = calls.find((n) => n.getKind() === SyntaxKind.CallExpression) as
          | CallExpression
          | undefined;
        if (!topCall) continue;

        const guards = new Set<string>();
        const keys: string[] = [];
        collectGuardCalls(topCall, guards, keys);
        if (guards.size === 0) continue;

        usages.push({
          file: sourceFile.getFilePath(),
          exportName,
          guards,
          explicitKey: keys[0] ?? null,
        });
      }
    }
  }

  return usages;
}

function parseBitMap(source: string): { header: string; entries: [string, number][] } {
  const match = source.match(/export const SECTION_BIT_MAP: Record<string, number> = \{([\s\S]*?)\};/);
  if (!match) throw new Error(`Could not parse ${BIT_MAP_PATH}`);
  const header = source.slice(0, match.index);
  const entries: [string, number][] = [];
  for (const line of match[1].split("\n")) {
    const entryMatch = line.match(/^\s*(\w+):\s*(\d+),?\s*$/);
    if (entryMatch) entries.push([entryMatch[1], Number(entryMatch[2])]);
  }
  return { header, entries };
}

function serializeBitMap(header: string, entries: [string, number][]): string {
  const body = entries.map(([key, bit]) => `  ${key}: ${bit},`).join("\n");
  return `${header}export const SECTION_BIT_MAP: Record<string, number> = {\n${body}\n};\n`;
}

function main(): void {
  const check = process.argv.includes("--check");

  const project = new Project({
    tsConfigFilePath: path.join(APP_ROOT, "tsconfig.json"),
  });

  const localePaths = resolveLocalePaths(project);
  const usages = findRouteGuardUsages(project);

  for (const usage of usages) {
    const hasAuthMethod = usage.guards.has("APIKeyRoute") || usage.guards.has("OauthAppRoute");
    const hasPermission = usage.guards.has("Read") || usage.guards.has("Write");
    if (hasPermission && !hasAuthMethod) {
      console.error(
        `${path.relative(APP_ROOT, usage.file)} (${usage.exportName}): ` +
          `@Read/@Write requires @APIKeyRoute and/or @OauthAppRoute to be present.`,
      );
      process.exitCode = 1;
    }
  }
  if (process.exitCode === 1) return;

  const discoveredKeys = new Set<string>();
  for (const usage of usages) {
    if (!usage.guards.has("Read") && !usage.guards.has("Write")) continue;
    discoveredKeys.add(usage.explicitKey ?? deriveSectionKeyFromPath(usage.file));
  }

  const bitMapSource = readFileSync(BIT_MAP_PATH, "utf-8");
  const { header, entries } = parseBitMap(bitMapSource);
  const existingKeys = new Set(entries.map(([key]) => key));

  const newKeys = [...discoveredKeys].filter((key) => !existingKeys.has(key)).sort();
  let nextBit = entries.reduce((max, [, bit]) => Math.max(max, bit), -1) + 1;
  const newEntries: [string, number][] = newKeys.map((key) => [key, nextBit++]);
  const updatedEntries = [...entries, ...newEntries];
  const updatedBitMapSource = serializeBitMap(header, updatedEntries);

  const allKeys = updatedEntries.map(([key]) => key);
  const localeUpdates: Record<string, { path: string; before: string; after: string }> = {};

  for (const [locale, localePath] of Object.entries(localePaths)) {
    const before = readFileSync(localePath, "utf-8");
    const data = JSON.parse(before) as Record<string, unknown>;
    const permissions = (data.permissions ??= {}) as Record<string, unknown>;
    const sections = (permissions.sections ??= {}) as Record<string, unknown>;

    for (const key of allKeys) {
      if (sections[key] === undefined) {
        sections[key] = { label: key, description: "" };
      }
    }

    const after = JSON.stringify(data, null, 2);
    localeUpdates[locale] = { path: localePath, before, after };
  }

  const bitMapChanged = updatedBitMapSource !== bitMapSource;
  const localeChanged = Object.values(localeUpdates).some((u) => u.before !== u.after);

  if (!bitMapChanged && !localeChanged) {
    console.log("Route permissions are up to date.");
    return;
  }

  if (check) {
    console.error("Route permissions are stale. Run without --check to regenerate:");
    if (bitMapChanged) console.error(`  - ${path.relative(APP_ROOT, BIT_MAP_PATH)}`);
    for (const [locale, u] of Object.entries(localeUpdates)) {
      if (u.before !== u.after) console.error(`  - ${path.relative(APP_ROOT, u.path)} (${locale})`);
    }
    process.exitCode = 1;
    return;
  }

  if (bitMapChanged) writeFileSync(BIT_MAP_PATH, updatedBitMapSource);
  for (const u of Object.values(localeUpdates)) {
    if (u.before !== u.after) writeFileSync(u.path, u.after);
  }
  console.log(`Updated route permissions: ${newKeys.length} new section key(s).`);
}

main();
