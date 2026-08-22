import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://escale.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/recherche", "/decouvrir", "/charte-prix-juste", "/cgu", "/confidentialite", "/contact"];
  return routes.map((route) => ({
    url: `${site}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/recherche" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/recherche" ? 0.9 : 0.7,
  }));
}
