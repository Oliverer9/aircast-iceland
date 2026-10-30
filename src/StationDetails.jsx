import { levelColor, levelName } from './airLevels.js';

const number = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const clock = (time) => time.slice(11, 16); // "2026-10-28 20:00:00" or "2026-10-28T20:50:00" → "20:00"

export default function StationDetails({ station }) {
  return (
    <section className="card" aria-labelledby="details-heading">
      <h2 id="details-heading">{station.name}</h2>
      <p className="overall">
        <span className="swatch" style={{ background: levelColor(station.level) }} aria-hidden="true" />
        Air quality: <strong>{levelName(station.level)}</strong>
        <span className="muted"> · hour ending {clock(station.readings[0].time)}</span>
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

      {station.weather && (
        <>
          <h3>Weather nearby</h3>
          <p className="muted">
            {station.weather.name}, {number(station.weather.distanceKm)} km away, at {clock(station.weather.time)}
          </p>
          <dl>
            <dt>Wind</dt>
            <dd>
              {number(station.weather.wind)} m/s from {station.weather.direction}
              {station.weather.gusts !== null && `, gusts ${number(station.weather.gusts)} m/s`}
            </dd>
            <dt>Temperature</dt>
            <dd>{number(station.weather.temperature)} °C</dd>
          </dl>
        </>
      )}
    </section>
  );
}
