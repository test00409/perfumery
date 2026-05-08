const BASE_IP = process.env.NEXT_PUBLIC_BASE_IP || "192.168.1.14";
const BASE_PORT = process.env.NEXT_PUBLIC_BASE_PORT || "4010";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    domains: ["192.168.1.14"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: BASE_IP,
        port: BASE_PORT,
        pathname: "/v1/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: BASE_PORT,
        pathname: "/v1/**",
      },
      {
        protocol: "https",
        hostname: "perfumery-uploads.s3.ap-south-1.amazonaws.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "api.perfumery.net.in",
        port: "4010",
        pathname: "/api/v1/**",
      },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "th.bing.com" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    serverActions: {},
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
