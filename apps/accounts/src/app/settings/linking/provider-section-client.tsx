"use client";

import dynamic from "next/dynamic";

export const ProviderSectionClient = dynamic(
  () =>
    import("@/components/auth/settings/provider-section").then(
      (m) => m.ProviderSection,
    ),
  { ssr: false },
);
