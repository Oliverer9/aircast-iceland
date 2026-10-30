// Distance in km between two points on the Earth (haversine formula).
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// The nearest of a list of { lat, lon } points, with its distance.
export function nearest(point, candidates) {
  let best = null;
  for (const c of candidates) {
    const km = distanceKm(point, c);
    if (!best || km < best.km) best = { item: c, km };
  }
  return best;
}
