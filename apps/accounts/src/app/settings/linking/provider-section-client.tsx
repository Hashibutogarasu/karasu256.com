"use client";

import dynamic from "next/dynamic";
import { faGoogle, faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Provider } from "@/components/auth/settings/provider-section";

const ProviderSectionLazy = dynamic(
  () =>
    import("@/components/auth/settings/provider-section").then(
      (m) => m.ProviderSection,
    ),
  { ssr: false },
);

const providers: Provider[] = [
  { id: "google", label: "Google", icon: faGoogle },
  { id: "github", label: "GitHub", icon: faGithub },
];

/** @returns ProviderSection loaded client-side only with the supported OAuth providers. */
export function ProviderSectionClient() {
  return <ProviderSectionLazy providers={providers} />;
}
