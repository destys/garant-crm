// next.config.js или next.config.mjs
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "downloader.disk.yandex.ru",
        pathname: "/**", // если нужно загрузить любые изображения с этого хоста
      },
    ],
  },
};

export default nextConfig;
