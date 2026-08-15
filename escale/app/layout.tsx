// app/layout.tsx
// Extrait à fusionner avec votre layout existant : ajoute les balises
// nécessaires pour que le navigateur propose "Installer Escale" (iOS,
// Android, desktop) et affiche la bonne icône/couleur au lancement.

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
      <body>{children}</body>
    </html>
  );
}
