export type GrowthProfile = {
  preferredCities?: string[];
  preferredAmenities?: string[];
  maxPrice?: number | null;
  guests?: number | null;
};

export type GrowthListing = {
  id: string;
  city?: string | null;
  amenities?: string[] | null;
  price_per_night?: number | string | null;
  guests?: number | null;
  average_rating?: number | string | null;
};

export function scoreListing(profile: GrowthProfile, listing: GrowthListing) {
  let score = Number(listing.average_rating || 0) * 3;
  const cities = (profile.preferredCities || []).map((v) => v.toLowerCase());
  if (listing.city && cities.includes(listing.city.toLowerCase())) score += 25;
  const wanted = profile.preferredAmenities || [];
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  score += wanted.filter((a) => amenities.includes(a)).length * 6;
  if (profile.maxPrice && Number(listing.price_per_night || 0) <= profile.maxPrice) score += 12;
  if (profile.guests && Number(listing.guests || 0) >= profile.guests) score += 8;
  return score;
}

export function rankListings(profile: GrowthProfile, listings: GrowthListing[], limit = 6) {
  return listings
    .map((listing) => ({ listing, score: scoreListing(profile, listing) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
