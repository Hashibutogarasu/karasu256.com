import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("home.title") };
}

/** Home page — intentionally empty while the site is under construction. */
export default function Home() {
  return <></>;
}
