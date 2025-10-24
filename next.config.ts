import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React Strict Mode in development to avoid duplicate effect runs and "2 logs" in console
  reactStrictMode: process.env.NODE_ENV === "development" ? false : true,
  compiler: {
    // Strip console.* in production builds, but keep error/warn
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  eslint: {
    // Do not block builds on linting errors. They will still show up in terminal.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/@vite/client",
        destination: "/api/vite-client-stub",
      },
    ];
  },
};

export default nextConfig;
