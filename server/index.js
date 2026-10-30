import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAirAndWind } from './combine.js';
import { getStationHistory } from './sources/loftgaedi.js';
import { getForecast } from './sources/forecast.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Both sources update at most every 10 minutes, so the server keeps the combined
// result for 5 minutes instead of calling both APIs on every page load.
const CACHE_MS = 5 * 60 * 1000;
let cache = { data: null, at: 0 };

// The browser calls this route; the server calls the real APIs.
app.get('/api/air-and-wind', async (req, res) => {
  try {
    if (!cache.data || Date.now() - cache.at > CACHE_MS) {
      cache = { data: await getAirAndWind(), at: Date.now() };
    }
    res.json(cache.data);
  } catch (err) {
    console.error('[/api/air-and-wind]', err.message);
    res.status(502).json({ error: 'Could not load air quality and weather data right now.' });
  }
});

// The last 24 hours for one air quality station, fetched when someone picks it.
const historyCache = new Map(); // station id -> { at, data }
app.get('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  // Station ids look like STA-IS0005A; refuse anything else before it reaches the API.
  if (!/^STA-[A-Z0-9]+$/.test(id)) return res.status(400).json({ error: 'Unknown station.' });
  try {
    const hit = historyCache.get(id);
    if (!hit || Date.now() - hit.at > CACHE_MS) {
      const data = await getStationHistory(id);
      if (!data) return res.status(404).json({ error: 'Unknown station.' });
      historyCache.set(id, { at: Date.now(), data });
    }
    res.json(historyCache.get(id).data);
  } catch (err) {
    console.error('[/api/history]', err.message);
    res.status(502).json({ error: 'Could not load the last 24 hours right now.' });
  }
});

// The forecast for the forecast place nearest a point (cached inside forecast.js).
app.get('/api/forecast', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const lang = req.query.lang === 'is' ? 'is' : 'en';
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ error: 'lat and lon are needed.' });
  try {
    const data = await getForecast(lat, lon, lang);
    if (!data) return res.status(404).json({ error: 'No forecast found.' });
    res.json(data);
  } catch (err) {
    console.error('[/api/forecast]', err.message);
    res.status(502).json({ error: 'Could not load the forecast right now.' });
  }
});

// In production (npm run build && npm start) the server also serves the built React app.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(dist));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
