import type { Metadata } from "next";
import { getSessionUser } from "@/lib/firebase-session";
import { ProfileSection } from "@/components/settings/profile-section";

export const metadata: Metadata = { title: "プロフィール — Karasu Lab" };

/** Profile settings page — shows the current user's info. */
export default async function ProfilePage() {
  const user = await getSessionUser();
  return <ProfileSection uid={user!.uid} email={user!.email ?? null} />;
}
