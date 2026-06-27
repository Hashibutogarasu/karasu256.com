import type { Metadata } from "next";
import { ResetPasswordConfirmForm } from "@/components/auth/reset-password-confirm-form";

export const metadata: Metadata = {
  title: "New Password — Karasu Lab",
};

interface Props {
  searchParams: Promise<{ uid?: string; token?: string }>;
}

/** Handles the one-time reset link from the password-reset email. */
export default async function ResetPasswordConfirmPage({ searchParams }: Props) {
  const { uid, token } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <ResetPasswordConfirmForm uid={uid ?? ""} token={token ?? ""} />
    </main>
  );
}
