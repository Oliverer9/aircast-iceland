import { useState } from 'react';
import { useApi } from './useApi.js';
import { levelName } from './airLevels.js';
import StationMap from './StationMap.jsx';
import StationDetails from './StationDetails.jsx';
import LevelLegend from './LevelLegend.jsx';

const DEFAULT_STATION = 'STA-IS0005A'; // Reykjavík Grensás

// The wind animation starts off for people who have asked their system for less motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const { status, data, error } = useApi('/api/air-and-wind');
  const [selectedId, setSelectedId] = useState(DEFAULT_STATION);
  const [showWind, setShowWind] = useState(!prefersReducedMotion);

  const station = data?.stations.find((s) => s.id === selectedId) ?? data?.stations[0];

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header>
        <h1>Air quality and wind in Iceland</h1>
      </header>
      <main id="main">
        <div role="status">
          {status === 'loading' && <p>Loading air quality and weather…</p>}
          {status === 'error' && <p className="error">Error: {error}</p>}
        </div>

        {station && (
          <>
            <label htmlFor="station">Station</label>
            <select id="station" value={station.id} onChange={(e) => setSelectedId(e.target.value)}>
              {data.stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} – {levelName(s.level)}
                </option>
              ))}
            </select>

            <div className="layout">
              <section className="card" aria-labelledby="map-heading">
                <h2 id="map-heading">Map of stations</h2>
                <p className="muted small">Pick a station on the map or in the list above. Scroll on the map to zoom.</p>
                <div className="map-controls">
                  <button type="button" className="toggle" aria-pressed={showWind} onClick={() => setShowWind(!showWind)}>
                    Wind animation
                  </button>
                  <p className="muted small">
                    The moving streaks follow the wind measured right now at {data.wind.length} weather stations.
                  </p>
                </div>
                <StationMap
                  stations={data.stations}
                  wind={data.wind}
                  showWind={showWind}
                  selectedId={station.id}
                  onSelect={setSelectedId}
                />
                <LevelLegend />
              </section>

              <StationDetails station={station} />
            </div>

            <p className="source">Sources: {data.sources.join(' and ')}. Levels: European Air Quality Index (EEA).</p>
          </>
        )}
      </main>
      <footer>
        <p>
          <a href="/report.html">Read the report</a>
        </p>
      </footer>
    </>
  );
}
