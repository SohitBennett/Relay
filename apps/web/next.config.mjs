/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @relay/shared ships TS source; let Next transpile it.
  transpilePackages: ["@relay/shared"],
};

export default nextConfig;
