import type { Metadata } from "next";
import { ProfileSection } from "@/components/auth/settings/profile-section";

export const metadata: Metadata = { title: "プロフィール — Karasu Lab" };

export default function ProfilePage() {
  return <ProfileSection />;
}
