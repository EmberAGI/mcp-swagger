import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // External packages for server components
  serverExternalPackages: [
    "@modelcontextprotocol/sdk",
    "@walletconnect/core",
    "@walletconnect/sign-client",
    "@walletconnect/universal-provider",
    "@walletconnect/ethereum-provider",
    "@walletconnect/keyvaluestorage",
  ],
  // Output configuration for production
  output: "standalone",
  // Set turbopack root to silence lockfile warning
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
