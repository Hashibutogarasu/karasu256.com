import type { Metadata } from "next";
import { ProviderSectionClient } from "./provider-section-client";

export const metadata: Metadata = { title: "アカウント連携 — Karasu Lab" };

export default function LinkingPage() {
  return <ProviderSectionClient />;
}
