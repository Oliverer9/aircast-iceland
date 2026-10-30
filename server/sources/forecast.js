// Veðurstofa's forecasts. They are only in the older XML service (xmlweather.vedur.is),
// not in the JSON API. Keyless.
// The XML service has forecasts for a set of places. Their numbers mostly match the JSON
// API's station numbers (checked 30.10.2026: 18 of 19 did, the last matches by name), so
// the coordinates come from the JSON station list rather than being typed in here.

import { nearest } from '../geo.js';

const PLACES = [1, 178, 571, 620, 990, 1395, 2738, 3317, 3471, 3696, 4614, 4912, 5544, 6015, 6176, 6515, 6802, 31392, 36132];
const XML_URL = 'https://xmlweather.vedur.is/?op_w=xml&type=forec&view=xml';
const STATIONS_URL = 'https://api.vedur.is/weather/stations';
const CACHE_MS = 30 * 60 * 1000; // forecasts are issued a few times a day

const cache = new Map(); // lang -> { at, places }

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Veðurstofa responded ${res.status} for ${url}`);
  return res.text();
}

const tag = (xml, name) => xml.match(new RegExp(`<${name}>([^<]*)</${name}>`))?.[1] ?? null;
const toIso = (time) => time.replace(' ', 'T'); // "2026-10-30 16:00:00" → "2026-10-30T16:00:00"

// A small regex parser is enough: the format is flat and the same every time.
function parseForecasts(xml) {
  return [...xml.matchAll(/<station id="(\d+)"\s+valid="1">([\s\S]*?)<\/station>/g)].map(([, id, body]) => ({
    id: Number(id),
    name: tag(body, 'name'),
    issued: toIso(tag(body, 'atime') ?? ''),
    forecasts: [...body.matchAll(/<forecast>([\s\S]*?)<\/forecast>/g)].map(([, f]) => ({
      time: toIso(tag(f, 'ftime')),
      temperature: Number(tag(f, 'T')),
      wind: Number(tag(f, 'F')),
      direction: tag(f, 'D'),
      condition: tag(f, 'W'),
    })),
  }));
}

async function getPlaces(lang) {
  const hit = cache.get(lang);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.places;

  const [xml, stations] = await Promise.all([
    fetchText(`${XML_URL}&lang=${lang}&ids=${PLACES.join(';')}`),
    fetchText(STATIONS_URL).then(JSON.parse),
  ]);
  const active = stations.filter((s) => s.ending === null);

  const places = parseForecasts(xml)
    .map((place) => {
      const match = active.find((s) => s.station === place.id) ?? active.find((s) => s.name === place.name);
      return match ? { ...place, lat: match.lat, lon: match.lon } : null;
    })
    .filter(Boolean);

  cache.set(lang, { at: Date.now(), places });
  return places;
}

// The forecast for the place nearest a point: the next 24 hours, every 3 hours.
export async function getForecast(lat, lon, lang) {
  const places = await getPlaces(lang);
  const match = nearest({ lat, lon }, places);
  if (!match) return null;

  const now = new Date().toISOString().slice(0, 19);
  const steps = match.item.forecasts
    .filter((f) => f.time >= now && Number(f.time.slice(11, 13)) % 3 === 0)
    .slice(0, 8);

  return {
    name: match.item.name,
    distanceKm: Math.round(match.km * 10) / 10,
    issued: match.item.issued,
    steps,
  };
}
