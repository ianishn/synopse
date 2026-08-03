import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @synopse/shared est publié en source TS : Next le transpile lui-même.
  transpilePackages: ["@synopse/shared"],
};

export default nextConfig;
