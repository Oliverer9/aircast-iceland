// Combines the two sources. They don't share station ids, but both have coordinates,
// so each air quality station gets the nearest weather station.

import { getAirStations } from './sources/loftgaedi.js';
import { getWeatherStations } from './sources/vedur.js';

// Distance in km between two points on the Earth (haversine formula).
function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function nearest(point, candidates) {
  let best = null;
  for (const c of candidates) {
    const km = distanceKm(point, c);
    if (!best || km < best.km) best = { station: c, km };
  }
  return best;
}

export async function getAirAndWind() {
  const [air, weather] = await Promise.all([getAirStations(), getWeatherStations()]);

  const stations = air
    .map((a) => {
      const match = nearest(a, weather);
      return {
        ...a,
        weather: match && { ...match.station, distanceKm: Math.round(match.km * 10) / 10 },
      };
    })
    .sort((x, y) => x.name.localeCompare(y.name, 'is'));

  // Every weather station's wind, for the animated wind layer on the map.
  const wind = weather
    .filter((w) => w.directionDegrees !== null)
    .map((w) => ({ lat: w.lat, lon: w.lon, speed: w.wind, from: w.directionDegrees }));

  // Every weather station's latest reading, for clicking anywhere on the map.
  const weatherStations = weather.map((w) => ({
    name: w.name,
    lat: w.lat,
    lon: w.lon,
    time: w.time,
    temperature: w.temperature,
    wind: w.wind,
    gusts: w.gusts,
    direction: w.direction,
  }));

  return {
    sources: ['Loftgæði (Umhverfis- og orkustofnun)', 'Veðurstofa Íslands'],
    fetchedAt: new Date().toISOString(),
    stations,
    wind,
    weatherStations,
  };
}
