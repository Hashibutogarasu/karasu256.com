import type { Metadata } from "next";
import { OtherSection } from "@/components/settings/other-section";

export const metadata: Metadata = { title: "その他の設定 — Karasu Lab" };

/** Other settings page — shows authorized apps and other miscellaneous settings. */
export default function OtherPage() {
  return <OtherSection />;
}
