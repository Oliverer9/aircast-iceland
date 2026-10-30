import { useState } from 'react';
import { useApi } from './useApi.js';
import { useText } from './i18n.jsx';
import { useTheme } from './theme.js';
import { nearest } from './geo.js';
import StationMap from './StationMap.jsx';
import StationDetails from './StationDetails.jsx';
import LevelLegend from './LevelLegend.jsx';
import Forecast from './Forecast.jsx';
import SiteHeader from './SiteHeader.jsx';

const DEFAULT_STATION = 'STA-IS0005A'; // Reykjavík Grensás
const REFRESH_MS = 5 * 60 * 1000; // the same as the server's cache, so each refresh can bring new data

// The wind animation starts off for people who have asked their system for less motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const { t, levelName, number } = useText();
  const { dark, toggle: toggleDark } = useTheme();
  const { status, data, error } = useApi('/api/air-and-wind', REFRESH_MS);
  const [selectedId, setSelectedId] = useState(DEFAULT_STATION);
  const [showWind, setShowWind] = useState(!prefersReducedMotion);
  const [focus, setFocus] = useState(null); // a station the map should move to
  const [nearMe, setNearMe] = useState(null); // { key, vars } for the status message

  const station = data?.stations.find((s) => s.id === selectedId) ?? data?.stations[0];

  // Ask the browser where we are (it asks the visitor first), then pick the nearest station.
  function findNearMe() {
    if (!navigator.geolocation) {
      setNearMe({ key: 'nearMeFailed' });
      return;
    }
    setNearMe({ key: 'nearMeLooking' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const here = { lat: position.coords.latitude, lon: position.coords.longitude };
        const match = nearest(here, data.stations);
        setSelectedId(match.item.id);
        setFocus({ id: match.item.id, at: Date.now() });
        setNearMe({ key: 'nearMeFound', vars: { name: match.item.name, km: match.km } });
      },
      (err) => setNearMe({ key: err.code === err.PERMISSION_DENIED ? 'nearMeDenied' : 'nearMeFailed' }),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }

  return (
    <>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <SiteHeader data={data} dark={dark} onToggleDark={toggleDark} />
      <main id="main">
        <div role="status">
          {status === 'loading' && <p>{t('loading')}</p>}
          {status === 'error' && <p className="error">{t('error', { message: error })}</p>}
        </div>

        {station && (
          <>
            <div className="station-picker">
              <label htmlFor="station">{t('station')}</label>
              <select id="station" value={station.id} onChange={(e) => setSelectedId(e.target.value)}>
                {data.stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} – {levelName(s.level)}
                  </option>
                ))}
              </select>
              <button type="button" className="toggle near-me" onClick={findNearMe}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" fill="currentColor" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {t('nearMe')}
              </button>
              <p className="muted small near-me-status" role="status">
                {nearMe && t(nearMe.key, { ...nearMe.vars, km: nearMe.vars ? number(nearMe.vars.km) : '' })}
              </p>
            </div>

            <div className="layout">
              <section className="card map-card" aria-labelledby="map-heading">
                <div className="card-head">
                  <h2 id="map-heading">{t('mapTitle')}</h2>
                  <button type="button" className="toggle" aria-pressed={showWind} onClick={() => setShowWind(!showWind)}>
                    {t('windAnimation')}
                  </button>
                </div>
                <p className="muted small map-hint">{t('mapHint', { count: data.wind.length })}</p>
                <StationMap
                  stations={data.stations}
                  wind={data.wind}
                  weatherStations={data.weatherStations}
                  showWind={showWind}
                  dark={dark}
                  selectedId={station.id}
                  focus={focus}
                  onSelect={setSelectedId}
                />
                <LevelLegend />
              </section>

              <StationDetails station={station} />
            </div>

            <section className="card forecast-card" aria-labelledby="forecast-heading">
              <h2 id="forecast-heading">{t('forecast')}</h2>
              <Forecast lat={station.lat} lon={station.lon} />
            </section>
          </>
        )}
      </main>
      <footer className="site-footer">
        {data && <p>{t('sources', { sources: data.sources.join(' & ') })}</p>}
        <p>
          <a href="/report.html">{t('report')}</a> {t('reportAfter')}
        </p>
      </footer>
    </>
  );
}
