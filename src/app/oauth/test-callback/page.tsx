"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function TestCallbackContent() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code") ?? undefined;
    const state = params.get("state") ?? undefined;
    const error = params.get("error") ?? undefined;

    if (window.opener) {
      window.opener.postMessage(
        { type: "oauth_test_callback", code, state, error },
        "*",
      );
      window.close();
    }
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Processing…</p>
    </div>
  );
}

export default function TestCallbackPage() {
  return (
    <Suspense>
      <TestCallbackContent />
    </Suspense>
  );
}
