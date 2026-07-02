import type { Metadata } from "next";
import { getSessionUser } from "@/lib/firebase-session";
import { getUser } from "@/lib/db/ensure-user";
import { ProfileSection } from "@/components/settings/profile-section";

export const metadata: Metadata = { title: "プロフィール — Karasu Lab" };

/** Profile settings page — shows the current user's info. */
export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  const dbUser = await getUser(sessionUser!.uid);
  return (
    <ProfileSection
      uid={sessionUser!.uid}
      email={sessionUser!.email ?? null}
      iconUrl={dbUser?.iconUrl ?? null}
    />
  );
}
