import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Data imports upload a whole CSV backup through a server action.
    serverActions: { bodySizeLimit: "50mb" },
  },
};

export default nextConfig;
