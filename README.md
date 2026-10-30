# AirCast Iceland

Air quality and weather in Iceland, live. Made for the Vefskólinn Module 4 guide "Connecting to the World":
https://io.vefskoli.is/guides/653a73397a41e11fa6e5423f

- Live site: https://aircast-iceland.onrender.com/
- Report: https://aircast-iceland.onrender.com/report.html

Requirements: at least **two APIs**, **one MCP server**, at least **one skill** (used or written),
and a **report** explaining every decision. The live site must link to both the site and the report.

## Run it

```
npm install
npm run dev
```

Open http://localhost:5173. Vite serves React there and forwards `/api/*` to the Express server on port 3001.

Production-style: `npm run build` then `npm start`, and open http://localhost:3001.

## Deploy (Render)

New **Web Service** from this GitHub repository, with:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Instance type: Free

Render sets `PORT` itself, and the server serves both the API and the built site. No environment
variables are needed, because both APIs are keyless.

## The APIs

- **Loftgæði** (air quality, https://api.ust.is/aq): `getLatest` for the newest readings, `getStations` for coordinates.
- **Veðurstofa** (weather, https://api.vedur.is/weather): `observations/aws/10min/latest` for every station, `stations` for coordinates.
- **Veðurstofa forecasts** (https://xmlweather.vedur.is): the older XML service, the only one with forecasts. Its place numbers mostly match the JSON API's, so coordinates come from the JSON station list.

They don't share station ids, so each air quality station is matched to the nearest weather station by distance.

## MCP server

`.mcp.json` connects the **vedurstofa-mcp** server (pinned to 1.0.1) to GitHub Copilot in VS Code.
Start it with **Ctrl+Shift+P → MCP: List Servers → vedurstofa → Start Server**, then use Copilot Chat in
**Agent** mode. It's for the agent while building, not for the website.

## Skill

`.agents/skills/verify-weather-data/SKILL.md` makes the agent check live weather and air quality answers
against the clock and the real API before replying. Type `/skills` in Copilot Chat (Agent mode) to see it.

## How it's built

- `server/sources/loftgaedi.js`, `server/sources/vedur.js`, `server/sources/forecast.js` – one file per source. Fetch, check `res.ok`, return a small clean shape.
- `server/combine.js` – joins air quality and weather by nearest station; `server/geo.js` has the distance maths.
- `server/airIndex.js` – the European Air Quality Index levels (EEA) for each reading and station.
- `server/index.js` – the routes: `/api/air-and-wind`, `/api/history/:station` and `/api/forecast`, with caching. Secret keys would be read from `.env` here only.
- `src/useApi.js` – fetches our own `/api` routes with loading and error state, and can refresh on an interval.
- `src/i18n.jsx` – all the page's text in English and Icelandic. `src/theme.js` – light and dark mode.
- `src/App.jsx` – loads the data, keeps track of the chosen station, and the "Near me" button.
- `src/SiteHeader.jsx` – name, language and dark mode buttons, and the live summary.
- `src/StationMap.jsx` – Leaflet map with one marker per station, coloured by level, plus pollution clouds.
- `src/WindLayer.jsx` – the animated wind streaks, built from every Veðurstofa station's wind.
- `src/ClickWeather.jsx` – click anywhere on the map for the nearest weather station's reading.
- `src/StationDetails.jsx` – the chosen station: level badge, advice, pollutant bars, weather and forecast.
- `src/HistoryChart.jsx` – the last 24 hours as a line chart, with a table view. `src/Forecast.jsx` – the next 24 hours.
- `src/LevelLegend.jsx`, `src/airLevels.js` – the level colours and the legend.
- `public/report.html` – the report page.

### Adding another API

1. Create `server/sources/<name>.js` following the two that are there.
2. Add `app.get('/api/<name>', …)` in `server/index.js`.
3. If it needs a key, add it to `.env` (copy `.env.example`) and read it with `process.env.NAME`.
4. Make `src/<Name>Card.jsx` using `useApi('/api/<name>')` and add it to `App.jsx`.
