// next.config.js или next.config.mjs
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
