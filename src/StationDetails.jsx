import { levelColor, levelTextColor } from './airLevels.js';
import { useText } from './i18n.jsx';
import HistoryChart from './HistoryChart.jsx';
import Forecast from './Forecast.jsx';

const clock = (time) => time.slice(11, 16); // "2026-10-28 20:00:00" or "2026-10-28T20:50:00" → "20:00"

// An arrow pointing the way the wind blows. The API gives where it comes FROM, so turn it
// round by 180°. Decorative: the direction is written in the text next to it.
function WindArrow({ from }) {
  return (
    <svg className="wind-arrow" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${from + 180}deg)` }}>
      <path d="M12 3v16M6 9l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StationDetails({ station }) {
  const { t, levelName, pollutantName, advice, number, direction } = useText();
  const weather = station.weather;
  const tips = advice(station.level);

  return (
    <section className="card details-card" aria-labelledby="details-heading">
      <h2 id="details-heading">{station.name}</h2>
      <p className="muted small">
        {station.municipality && `${station.municipality} · `}
        {t('hourEnding', { time: clock(station.readings[0].time) })}
      </p>

      <p className="level-badge" style={{ background: levelColor(station.level), color: levelTextColor(station.level) }}>
        <span className="level-badge-label">{t('airQuality')}</span>
        <span className="level-badge-value">{levelName(station.level)}</span>
      </p>

      <h3>{t('whatItMeans')}</h3>
      {tips ? (
        <>
          <dl className="advice">
            <div>
              <dt>{t('everyone')}</dt>
              <dd>{tips[0]}</dd>
            </div>
            <div>
              <dt>
                {t('sensitive')} <span className="muted small">({t('sensitiveNote')})</span>
              </dt>
              <dd>{tips[1]}</dd>
            </div>
          </dl>
          <p className="muted small">{t('adviceSource')}</p>
        </>
      ) : (
        <p className="small">{t('noIndexAdvice')}</p>
      )}

      <h3>{t('pollution')}</h3>
      <ul className="bars">
        {station.readings.map((r) => (
          <li key={r.code}>
            <div className="bar-label">
              <span>{pollutantName(r.code)}</span>
              <span>
                {number(r.value)} {r.unit} · <strong>{levelName(r.level)}</strong>
              </span>
            </div>
            {r.level ? (
              <div className="bar-track" aria-hidden="true">
                <div
                  className="bar-fill"
                  style={{
                    // At least a sliver, so "Good" at 0 is still visible.
                    width: `${Math.max(3, r.level.scale * 100)}%`,
                    background: levelColor(r.level),
                  }}
                />
              </div>
            ) : (
              <p className="muted small">{t('noLevels')}</p>
            )}
          </li>
        ))}
      </ul>

      <h3>{t('last24h')}</h3>
      <HistoryChart key={station.id} stationId={station.id} />

      {weather && (
        <>
          <h3>{t('weatherNearby')}</h3>
          <p className="muted small">
            {t('kmAway', { name: weather.name, km: number(weather.distanceKm), time: clock(weather.time) })}
          </p>
          <dl className="weather-tiles">
            <div className="tile">
              <dt>{t('temperature')}</dt>
              {/* Some stations don't report every value; don't crash on a missing one. */}
              <dd className="tile-value">
                {weather.temperature !== null ? `${number(weather.temperature)} °C` : t('notMeasured')}
              </dd>
            </div>
            <div className="tile">
              <dt>{t('wind')}</dt>
              <dd className="tile-value">
                {weather.directionDegrees !== null && weather.directionDegrees !== undefined && (
                  <WindArrow from={weather.directionDegrees} />
                )}
                {number(weather.wind)} m/s
              </dd>
              <dd className="small muted">
                {weather.direction && t('from', { dir: direction(weather.direction) })}
                {weather.gusts !== null &&
                  `${weather.direction ? ', ' : ''}${t('gusts', { value: number(weather.gusts) })}`}
              </dd>
            </div>
          </dl>
        </>
      )}

      <h3>{t('forecast')}</h3>
      <Forecast lat={station.lat} lon={station.lon} />
    </section>
  );
}
