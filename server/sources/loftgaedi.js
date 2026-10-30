// Loftgæði: hourly air quality from Umhverfis- og orkustofnun. Keyless.
// Docs: https://api.ust.is/aq
// Values come as strings, and the hours are an object keyed "0", "1"… where "0" is the newest.

import { airLevel } from '../airIndex.js';

const BASE = 'https://api.ust.is/aq/a';

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Loftgæði responded ${res.status} for ${url}`);
  return res.json();
}

// Stations measure different things, so we keep whichever of these each one has.
// (NO and "NOX as NO2" are left out; NO2 is the one with a health limit.)
const POLLUTANTS = {
  PM10: 'Dust (PM10)',
  'PM2.5': 'Fine dust (PM2.5)',
  PM1: 'Very fine dust (PM1)',
  NO2: 'Nitrogen dioxide (NO₂)',
  SO2: 'Sulphur dioxide (SO₂)',
  H2S: 'Hydrogen sulphide (H₂S)',
  O3: 'Ozone (O₃)',
  CO: 'Carbon monoxide (CO)',
};

function newest(code, parameter) {
  const reading = parameter['0'];
  const value = Number(reading?.value);
  if (!reading || reading.value === '' || !Number.isFinite(value)) return null;
  // Sensors read slightly below zero when there is almost nothing in the air. Show that as 0.
  const clean = Math.max(0, value);
  return {
    code,
    label: POLLUTANTS[code],
    value: clean,
    unit: parameter.unit,
    time: reading.endtime,
    level: airLevel(code, clean),
  };
}

// A station is as bad as its worst pollutant, like the EEA index. null if nothing it measures has an index.
function worstLevel(readings) {
  const levels = readings.map((r) => r.level).filter(Boolean);
  if (levels.length === 0) return null;
  const worst = levels.reduce((a, b) => (b.index > a.index ? b : a));
  return { index: worst.index, label: worst.label };
}

// The last 24 hours for one station, oldest first, for the charts. Same pollutants as above.
export async function getStationHistory(id) {
  const data = await getJson(`${BASE}/getCurrent/id/${encodeURIComponent(id)}`);
  const station = data[id];
  if (!station) return null;

  const readings = Object.keys(POLLUTANTS)
    .filter((code) => station.parameters[code])
    .map((code) => {
      const parameter = station.parameters[code];
      const points = Object.keys(parameter)
        .filter((key) => /^\d+$/.test(key))
        .map((key) => parameter[key])
        .filter((reading) => reading.value !== '' && Number.isFinite(Number(reading.value)))
        .map((reading) => ({ time: reading.endtime, value: Math.max(0, Number(reading.value)) }))
        .sort((a, b) => a.time.localeCompare(b.time));
      return { code, unit: parameter.unit, points };
    })
    .filter((reading) => reading.points.length > 1);

  return { id, name: station.name, readings };
}

// Newest reading from every station that is reporting, joined with each station's coordinates
// (getLatest has no lat/lon, getStations does).
export async function getAirStations() {
  const [stations, latest] = await Promise.all([
    getJson(`${BASE}/getStations`),
    getJson(`${BASE}/getLatest`),
  ]);

  const coords = new Map(stations.map((s) => [s.local_id, s]));

  return Object.entries(latest)
    .filter(([id]) => coords.has(id))
    .map(([id, station]) => ({
      id,
      name: station.name,
      municipality: coords.get(id).municipality,
      lat: Number(coords.get(id).latitude),
      lon: Number(coords.get(id).longitude),
      readings: Object.keys(POLLUTANTS)
        .filter((code) => station.parameters[code])
        .map((code) => newest(code, station.parameters[code]))
        .filter(Boolean),
    }))
    .filter((station) => station.readings.length > 0)
    .map((station) => ({ ...station, level: worstLevel(station.readings) }));
}
