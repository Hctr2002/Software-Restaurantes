import type { Config } from "tailwindcss";
import sharedConfig from "@menu-bites/ui/tailwind.config";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [sharedConfig as any],
};

export default config;
