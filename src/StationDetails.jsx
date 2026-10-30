import { levelColor, levelName, levelTextColor } from './airLevels.js';

const number = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
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
  const weather = station.weather;

  return (
    <section className="card details-card" aria-labelledby="details-heading">
      <h2 id="details-heading">{station.name}</h2>
      <p className="muted small">
        {station.municipality && `${station.municipality} · `}hour ending {clock(station.readings[0].time)} UTC
      </p>

      <p className="level-badge" style={{ background: levelColor(station.level), color: levelTextColor(station.level) }}>
        <span className="level-badge-label">Air quality</span>
        <span className="level-badge-value">{levelName(station.level)}</span>
      </p>

      <h3>Pollution levels</h3>
      <ul className="bars">
        {station.readings.map((r) => (
          <li key={r.code}>
            <div className="bar-label">
              <span>{r.label}</span>
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
              <p className="muted small">The European index has no levels for this one.</p>
            )}
          </li>
        ))}
      </ul>

      {weather && (
        <>
          <h3>Weather nearby</h3>
          <p className="muted small">
            {weather.name}, {number(weather.distanceKm)} km away, at {clock(weather.time)} UTC
          </p>
          <dl className="weather-tiles">
            <div className="tile">
              <dt>Temperature</dt>
              {/* Some stations don't report every value; don't crash on a missing one. */}
              <dd className="tile-value">
                {weather.temperature !== null ? `${number(weather.temperature)} °C` : 'Not measured'}
              </dd>
            </div>
            <div className="tile">
              <dt>Wind</dt>
              <dd className="tile-value">
                {weather.directionDegrees !== null && weather.directionDegrees !== undefined && (
                  <WindArrow from={weather.directionDegrees} />
                )}
                {number(weather.wind)} m/s
              </dd>
              <dd className="small muted">
                {weather.direction && `from ${weather.direction}`}
                {weather.gusts !== null && `${weather.direction ? ', ' : ''}gusts ${number(weather.gusts)} m/s`}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  );
}
