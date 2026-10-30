import { useState } from 'react';
import { Popup, useMapEvent } from 'react-leaflet';
import { nearest } from './geo.js';
import { useText } from './i18n.jsx';

// Click anywhere on the map to see the latest reading from the nearest Veðurstofa
// weather station. It is the nearest real measurement, not an estimate for that exact
// spot, so the popup always says which station it is and how far away.

const FAR_KM = 40; // beyond this, say clearly that the station is far away
const clock = (time) => time.slice(11, 16); // "2026-10-30T00:20:00" → "00:20"

export default function ClickWeather({ weatherStations }) {
  const { t, number, direction } = useText();
  const [clicked, setClicked] = useState(null);

  useMapEvent('click', (e) => {
    const match = nearest({ lat: e.latlng.lat, lon: e.latlng.lng }, weatherStations);
    if (match) setClicked({ latlng: e.latlng, station: match.item, km: match.km });
  });

  if (!clicked) return null;
  const { latlng, station, km } = clicked;

  return (
    <Popup position={latlng} eventHandlers={{ remove: () => setClicked(null) }}>
      <div className="click-weather">
        <p className="click-weather-title">{t('weatherNearHere')}</p>
        <p className="muted small">
          {t('kmAway', { name: station.name, km: number(km), time: clock(station.time) })}
          {km > FAR_KM && <strong> {t('farAway')}</strong>}
        </p>
        <dl className="weather-tiles compact">
          <div className="tile">
            <dt>{t('temperature')}</dt>
            <dd className="tile-value">
              {station.temperature !== null ? `${number(station.temperature)} °C` : t('notMeasured')}
            </dd>
          </div>
          <div className="tile">
            <dt>{t('wind')}</dt>
            <dd className="tile-value">{number(station.wind)} m/s</dd>
            <dd className="small muted">
              {station.direction && t('from', { dir: direction(station.direction) })}
              {station.gusts !== null && `${station.direction ? ', ' : ''}${t('gusts', { value: number(station.gusts) })}`}
            </dd>
          </div>
        </dl>
      </div>
    </Popup>
  );
}
