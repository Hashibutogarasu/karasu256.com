import type { Metadata } from "next";
import { DeveloperSection } from "@/components/settings/developer-section";

export const metadata: Metadata = { title: "デベロッパー設定 — Karasu Lab" };

/** Developer settings page — manages OAuth clients and API keys. */
export default function DeveloperPage() {
  return <DeveloperSection />;
}
