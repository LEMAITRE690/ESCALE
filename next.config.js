// npm install next-pwa

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // le SW gêne le hot-reload en dev
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      // Photos de logements : cache-first, elles changent rarement une fois publiées
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/listing-photos\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "escale-listing-photos",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // Recherche / calendrier / réservations : toujours à jour en priorité, cache en secours
      urlPattern: /^https:\/\/escale\.app\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "escale-api",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
