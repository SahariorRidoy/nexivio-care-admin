import type { NextConfig } from "next";
import path from "path";
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd()),
  experimental: {
    cpus: 1,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "api.nexiviocare.com" },
    ],
  },
};

export default nextConfig;
