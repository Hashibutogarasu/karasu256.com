"use server";

export async function useMicroCMSAPIKey() {
  const secret = process.env.MICROCMS_API_KEY!;
  if (!secret) {
    throw new Error("MICROCMS_API_KEY is not defined");
  }
  return secret;
}