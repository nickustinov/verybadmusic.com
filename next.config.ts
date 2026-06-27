import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Covers are downscaled to JPEG client-side before submit; this is a safety
    // net so a moderately large image still gets through the Server Action.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
