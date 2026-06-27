import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — Karasu Lab",
};

/** Password reset page — accessible without authentication. */
export default function ResetPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <ResetPasswordForm />
    </main>
  );
}
