import { useEffect, useState } from "react";
import { getIdToken, onAuthStateChanged, type User } from "firebase/auth";
import type { Dispatch, SetStateAction } from "react";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { listPasskeyCredentials } from "@/lib/api/passkey-credentials";
import { listLinkedProviders, type LinkedProvider } from "@/lib/api/providers";

export interface ProviderSectionState {
  authUser: User | null;
  linked: LinkedProvider[];
  setLinked: Dispatch<SetStateAction<LinkedProvider[]>>;
  hasPasskeys: boolean;
  loading: string | null;
  setLoading: Dispatch<SetStateAction<string | null>>;
  /** True once both the Firebase auth callback and the linked-provider API call have resolved. */
  dataReady: boolean;
}

/**
 * Fetches all data required by ProviderSection and tracks readiness.
 * dataReady is false until both onAuthStateChanged has fired and listLinkedProviders
 * has returned, preventing UI decisions based on incomplete state.
 */
export function useProviderSection(): ProviderSectionState {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [linked, setLinked] = useState<LinkedProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [hasPasskeys, setHasPasskeys] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthUser(user);
      setLoadingAuth(false);
    });
  }, []);

  useEffect(() => {
    void listLinkedProviders()
      .then(setLinked)
      .catch(() => {})
      .finally(() => setLoadingProviders(false));

    const current = getFirebaseAuth().currentUser;
    if (!current) return;
    void getIdToken(current)
      .then((idToken) => listPasskeyCredentials(idToken))
      .then((creds) => setHasPasskeys(creds.length > 0))
      .catch(() => {});
  }, []);

  return {
    authUser,
    linked,
    setLinked,
    hasPasskeys,
    loading,
    setLoading,
    dataReady: !loadingAuth && !loadingProviders,
  };
}
