// Distance in km between two points on the Earth (haversine formula).
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// The nearest of a list of { lat, lon } items, with its distance.
export function nearest(point, items) {
  let best = null;
  for (const item of items) {
    const km = distanceKm(point, item);
    if (!best || km < best.km) best = { item, km };
  }
  return best;
}
