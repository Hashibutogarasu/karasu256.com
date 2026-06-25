import { config } from "@dotenvx/dotenvx";
config({ path: ".env.local", override: true });
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@Hashibutogarasu/ui", "@Hashibutogarasu/utils"],
  devIndicators: false
};

export default nextConfig;
