// next.config.js или next.config.mjs
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  darkMode: ["class"],
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
