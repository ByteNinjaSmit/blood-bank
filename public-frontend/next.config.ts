import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sanjivanicoe.org.in",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
    ],
  },
};

export default nextConfig;
