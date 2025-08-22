import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@/app/globals.css";
import { Providers } from "@/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  themeColor: "#ffffff",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-auto p-4 pt-0">
              <div className="flex flex-1 flex-col max-w-[1600px] mx-auto">
                <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:py-6">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}