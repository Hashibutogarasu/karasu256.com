import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { getDb, getRegisteredSections } from "@Hashibutogarasu/db";
import { oauthClients } from "@Hashibutogarasu/db/schema";
import { getSessionUser } from "@/lib/firebase-session";
import { AuthorizeForm } from "@/components/oauth/authorize-form";
import { stringOrNull } from "@Hashibutogarasu/utils/validation";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("oauth.authorize.title") };
}

/**
 * OAuth 2.0 authorization endpoint (user-facing consent page).
 *
 * Validates the request parameters and renders a consent form. Errors that
 * could enable open-redirect attacks (missing/invalid client_id, redirect_uri
 * mismatch) are shown inline rather than redirected to the callback.
 */
export default async function AuthorizePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const clientId = stringOrNull(params.client_id);
  const redirectUri = stringOrNull(params.redirect_uri);
  const responseType = stringOrNull(params.response_type);
  const permissionsParam = stringOrNull(params.permissions) ?? "0";
  const state = stringOrNull(params.state) ?? undefined;

  if (responseType !== "code") {
    return <ErrorPage message="response_type must be 'code'" />;
  }
  if (!clientId || !redirectUri) {
    return <ErrorPage message="Missing required parameters: client_id, redirect_uri" />;
  }

  const db = getDb();
  const [client] = await db
    .select({
      id: oauthClients.id,
      name: oauthClients.name,
      iconUrl: oauthClients.iconUrl,
      callbackUris: oauthClients.callbackUris,
      permissions: oauthClients.permissions,
    })
    .from(oauthClients)
    .where(eq(oauthClients.id, clientId));

  if (!client) {
    return <ErrorPage message="Unknown client_id" />;
  }
  if (!client.callbackUris.includes(redirectUri)) {
    return <ErrorPage message="redirect_uri does not match registered value" />;
  }

  const requestedPermissions = parseInt(permissionsParam, 10);
  if (
    isNaN(requestedPermissions) ||
    (BigInt(requestedPermissions) & ~client.permissions) !== 0n
  ) {
    return <ErrorPage message="Requested permissions exceed client registration" />;
  }

  const user = await getSessionUser();
  if (!user) {
    const returnUrl = `/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&permissions=${requestedPermissions}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
    redirect(`${process.env.NEXT_PUBLIC_ACCOUNTS_URL ?? "/"}?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  const sections = getRegisteredSections().map((s) => ({
    key: s.key,
    labelKey: s.labelKey,
    descriptionKey: s.descriptionKey,
    readMask: Number(s.readMask),
    writeMask: Number(s.writeMask),
  }));

  return (
    <AuthorizeForm
      client={{
        id: client.id,
        name: client.name,
        iconUrl: client.iconUrl ?? null,
      }}
      redirectUri={redirectUri}
      permissions={requestedPermissions}
      state={state}
      sections={sections}
    />
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-lg border border-border p-6 space-y-2">
        <p className="text-sm font-semibold text-destructive">Authorization Error</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
