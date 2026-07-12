'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import { clearSession, resyncSession } from '@/lib/api/auth-session';
import { authClient } from '@/lib/auth/client';
import { Button } from '@Hashibutogarasu/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@Hashibutogarasu/ui';
import { Identicon } from '@Hashibutogarasu/ui';
import { Separator } from '@Hashibutogarasu/ui';
import { Skeleton } from '@Hashibutogarasu/ui';
import { PasskeyList } from './passkey-list';
import { PasskeyCreateDialog } from './passkey-create-dialog';

/**
 * Account management card for authenticated users.
 *
 * When Firebase reports no active client session, first tries
 * {@link resyncSession} to restore it from the server-side cookie — client
 * persistence can be lost independently of that cookie (e.g. a browser
 * evicting site storage across a cross-site redirect round trip). Only if
 * that recovery fails does it call {@link clearSession} to remove the
 * server-side cookie before redirecting to `/`, preventing a redirect loop
 * caused by a genuinely stale cookie.
 */
export function AccountCard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [passkeyVersion, setPasskeyVersion] = useState(0);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      if (!u) {
        const customToken = await resyncSession();
        if (customToken) {
          try {
            await signInWithCustomToken(getFirebaseAuth(), customToken);
            return;
          } catch {
            /* fall through to sign-out below */
          }
        }
        await clearSession();
        router.replace('/');
      } else {
        setUser(u);
        setLoading(false);
      }
    });
  }, [router]);

  async function handleSignOut() {
    await authClient.signOut();
    await clearSession();
    await signOut(getFirebaseAuth());
  }

  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-start gap-3">
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Separator />
          <Skeleton className="h-3 w-16" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="size-7 rounded-md" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
          <Separator />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Signed in</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start gap-3">
          <Identicon value={user!.uid} size={64} className="border border-border" />
          <p className="text-sm text-muted-foreground break-all">{user!.email ?? user!.uid}</p>
        </div>
        <Separator />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Passkeys</p>
        <PasskeyList version={passkeyVersion} />
        {user!.email && <PasskeyCreateDialog email={user!.email} onSuccess={() => setPasskeyVersion((v) => v + 1)} />}
        <Separator />
        <Button variant="ghost" className="w-full" onClick={() => router.push('/settings')}>
          Settings
        </Button>
        <Button variant="outline" className="w-full" onClick={handleSignOut}>
          <FontAwesomeIcon icon={faRightFromBracket} />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
}
