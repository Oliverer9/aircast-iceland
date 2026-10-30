import { useApi } from './useApi.js';
import { useText } from './i18n.jsx';

// The next 24 hours, every 3 hours, from Veðurstofa's forecast for the nearest forecast place.
// The forecast service writes its own text (conditions, directions) in the chosen language.

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
// Icelandic forecasts use A (austur) and V (vestur) for east and west.
const toDegrees = (dir) => {
  const i = COMPASS.indexOf(dir?.replace(/A/g, 'E').replace(/V/g, 'W'));
  return i === -1 ? null : i * 22.5;
};

export default function Forecast({ lat, lon }) {
  const { lang, t, number } = useText();
  const { status, data } = useApi(`/api/forecast?lat=${lat}&lon=${lon}&lang=${lang}`, 30 * 60 * 1000);

  if (status === 'loading') return <p className="muted small">{t('forecastLoading')}</p>;
  if (status === 'error' || !data?.steps.length) return <p className="muted small">{t('forecastError')}</p>;

  return (
    <>
      <p className="muted small">
        {t('forecastFor', { name: data.name, km: number(data.distanceKm), time: data.issued.slice(11, 16) })}
      </p>
      <ol className="forecast">
        {data.steps.map((step) => {
          const degrees = toDegrees(step.direction);
          return (
            <li key={step.time}>
              <span className="forecast-time">{step.time.slice(11, 16)}</span>
              <span className="forecast-temp">{number(step.temperature)}°</span>
              <span className="forecast-wind">
                {degrees !== null && (
                  <svg className="wind-arrow small-arrow" viewBox="0 0 24 24" aria-hidden="true" style={{ transform: `rotate(${degrees + 180}deg)` }}>
                    <path d="M12 3v16M6 9l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {number(step.wind)} m/s {step.direction}
              </span>
              <span className="forecast-condition">{step.condition}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
