import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "api.openf1.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.formula1.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
