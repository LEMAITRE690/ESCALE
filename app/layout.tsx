// app/layout.tsx

import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Escale",
  description: "Réservez et gérez vos locations de vacances entre particuliers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Escale",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-apple-touch.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A3A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Link
          href="/voyageurs"
          aria-label="Accéder à l'espace voyageurs"
          className="fixed bottom-5 right-5 z-50 rounded-full border border-[#D9C6A7] bg-[#F8F4EC] px-5 py-3 text-sm font-semibold text-[#173C3A] shadow-lg transition hover:-translate-y-0.5 hover:bg-white"
        >
          Je suis voyageur →
        </Link>
      </body>
    </html>
  );
}
