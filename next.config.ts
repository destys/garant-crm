// next.config.js или next.config.mjs
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@tanstack/react-query",
    "@tanstack/react-table",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-dialog",
    "@radix-ui/react-popover",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "@radix-ui/react-dropdown-menu",
    "lucide-react",
    "recharts",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.spbgarant.ru",
        pathname: "/**", // если нужно загрузить любые изображения с этого хоста
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /strapi-scheme/,
    };
    return config;
  },
};

export default nextConfig;
