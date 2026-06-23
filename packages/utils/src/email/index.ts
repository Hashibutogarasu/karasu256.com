import { createElement } from "react";
import { Resend } from "resend";
import { PasswordResetEmail } from "./templates/PasswordResetEmail";

export interface SendPasswordResetEmailOptions {
  /** Resend API key. */
  apiKey: string;
  /** Verified sender address, e.g. "noreply@karasu256.com". */
  from: string;
  /** Recipient email address. */
  to: string;
  /** Fully-qualified one-time reset URL. */
  resetUrl: string;
}

/**
 * Sends a password reset email via Resend.
 *
 * @throws when the Resend API call fails.
 */
export async function sendPasswordResetEmail(
  opts: SendPasswordResetEmailOptions,
): Promise<void> {
  const resend = new Resend(opts.apiKey);
  const { error } = await resend.emails.send({
    from: opts.from,
    to: opts.to,
    subject: "パスワードリセット — Karasu Lab",
    react: createElement(PasswordResetEmail, { resetUrl: opts.resetUrl }),
  });
  if (error) {
    throw new Error(error.message);
  }
}
