import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Turbopack config vide pour eviter le conflit avec le plugin PWA (webpack)
  turbopack: {},
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Les appels /api/v1/* sont geres par le route handler proxy
  // dans src/app/api/v1/[...path]/route.ts
};

export default withPWA(nextConfig);
