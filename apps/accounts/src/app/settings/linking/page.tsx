import type { Metadata } from "next";
import { ProviderSection } from "@/components/auth/settings/provider-section";

export const metadata: Metadata = { title: "アカウント連携 — Karasu Lab" };

export default function LinkingPage() {
  return <ProviderSection />;
}
