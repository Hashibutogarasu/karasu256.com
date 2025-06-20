import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/microcms/:path*",
        destination: "https://karasu256.microcms.io/api/v1/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
