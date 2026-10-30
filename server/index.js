import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAirAndWind } from './combine.js';

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

// In production (npm run build && npm start) the server also serves the built React app.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(dist));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
