import type { NextConfig } from "next";

const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3000";
const normalizedApiBase = rawApiBase.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  crossOrigin: "anonymous",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${normalizedApiBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
