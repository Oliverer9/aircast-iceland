// Veðurstofa Íslands: weather observations from automatic stations. Keyless.
// Docs (Swagger): https://api.vedur.is/weather
// Field names are short: t = temperature °C, f = wind m/s, fg = gusts m/s, d_txt = wind direction.

const BASE = 'https://api.vedur.is/weather';

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Veðurstofa responded ${res.status} for ${url}`);
  return res.json();
}

// Latest 10-minute observation from every station, joined with each station's coordinates
// (the observations don't include lat/lon, the station list does).
export async function getWeatherStations() {
  const [stations, latest] = await Promise.all([
    getJson(`${BASE}/stations`),
    getJson(`${BASE}/observations/aws/10min/latest`),
  ]);

  const coords = new Map(stations.filter((s) => s.ending === null).map((s) => [s.station, s]));

  return latest
    .filter((obs) => coords.has(obs.station) && obs.f !== null)
    .map((obs) => ({
      id: obs.station,
      name: obs.name,
      lat: coords.get(obs.station).lat,
      lon: coords.get(obs.station).lon,
      time: obs.time,
      temperature: obs.t,
      wind: obs.f,
      gusts: obs.fg,
      direction: obs.d_txt,
      directionDegrees: obs.d, // where the wind comes FROM, 0 = north, 90 = east
    }));
}
