/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@menu-bites/ui", "@menu-bites/auth", "@menu-bites/store"],
  env: { NEXT_PUBLIC_APP_KEY: "local" },
};

export default nextConfig;
