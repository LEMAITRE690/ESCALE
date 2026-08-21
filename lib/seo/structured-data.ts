const site = process.env.NEXT_PUBLIC_SITE_URL || "https://escale.app";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Escale",
    url: site,
    description: "Plateforme française de réservation de locations de vacances entre particuliers.",
  };
}

export function lodgingJsonLd(listing: { id: string; title: string; city?: string | null; price_per_night?: number | string | null; average_rating?: number | string | null; review_count?: number | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    url: `${site}/logement/${listing.id}`,
    address: listing.city ? { "@type": "PostalAddress", addressLocality: listing.city, addressCountry: "FR" } : undefined,
    priceRange: listing.price_per_night ? `${listing.price_per_night} EUR / nuit` : undefined,
    aggregateRating: Number(listing.review_count) > 0 ? { "@type": "AggregateRating", ratingValue: Number(listing.average_rating || 0), reviewCount: Number(listing.review_count || 0) } : undefined,
  };
}
