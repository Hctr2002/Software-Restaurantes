/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@menu-bites/ui", "@menu-bites/auth", "@menu-bites/store", "lucide-react", "framer-motion"],
  env: { NEXT_PUBLIC_APP_KEY: "waiter" },
};

export default nextConfig;
