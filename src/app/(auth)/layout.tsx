export const metadata: Metadata = {
  title: "CRM Гарант v2",
  description: "",
  icons: {
    icon: [
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicons/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicons/favicon.ico", type: "image/x-icon" },
    ],
    apple: [
      { url: "/favicons/favicon-57x57.png", sizes: "57x57" },
      { url: "/favicons/favicon-60x60.png", sizes: "60x60" },
      { url: "/favicons/favicon-72x72.png", sizes: "72x72" },
      { url: "/favicons/favicon-76x76.png", sizes: "76x76" },
      { url: "/favicons/favicon-114x114.png", sizes: "114x114" },
      { url: "/favicons/favicon-120x120.png", sizes: "120x120" },
      { url: "/favicons/favicon-144x144.png", sizes: "144x144" },
      { url: "/favicons/favicon-152x152.png", sizes: "152x152" },
      { url: "/favicons/favicon-180x180.png", sizes: "180x180" },
    ],
    other: [
      { rel: "manifest", url: "/favicons/manifest.json" },
      { rel: "shortcut icon", url: "/favicons/favicon.ico" },
    ],
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/favicons/favicon-144x144.png",
    "msapplication-config": "/favicons/browserconfig.xml",
  },
  robots: {
    index: false,
    follow: false
  }
};

import "@/app/globals.css";
import { Metadata } from "next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
