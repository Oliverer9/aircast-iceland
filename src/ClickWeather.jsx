import { useState } from 'react';
import { Popup, useMapEvent } from 'react-leaflet';

// Click anywhere on the map to see the latest reading from the nearest Veðurstofa
// weather station. It is the nearest real measurement, not an estimate for that exact
// spot, so the popup always says which station it is and how far away.

const FAR_KM = 40; // beyond this, say clearly that the station is far away

function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const number = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const clock = (time) => time.slice(11, 16); // "2026-10-30T00:20:00" → "00:20"

export default function ClickWeather({ weatherStations }) {
  const [clicked, setClicked] = useState(null);

  useMapEvent('click', (e) => {
    const point = { lat: e.latlng.lat, lon: e.latlng.lng };
    let nearest = null;
    for (const s of weatherStations) {
      const km = distanceKm(point, s);
      if (!nearest || km < nearest.km) nearest = { station: s, km };
    }
    setClicked({ latlng: e.latlng, ...nearest });
  });

  if (!clicked?.station) return null;
  const { latlng, station, km } = clicked;

  return (
    <Popup position={latlng} eventHandlers={{ remove: () => setClicked(null) }}>
      <div className="click-weather">
        <p className="click-weather-title">Weather near here</p>
        <p className="muted small">
          {station.name}, {number(km)} km away, at {clock(station.time)} UTC
          {km > FAR_KM && <strong> (far from where you clicked)</strong>}
        </p>
        <dl className="weather-tiles compact">
          <div className="tile">
            <dt>Temperature</dt>
            <dd className="tile-value">
              {station.temperature !== null ? `${number(station.temperature)} °C` : 'Not measured'}
            </dd>
          </div>
          <div className="tile">
            <dt>Wind</dt>
            <dd className="tile-value">{number(station.wind)} m/s</dd>
            <dd className="small muted">
              {station.direction && `from ${station.direction}`}
              {station.gusts !== null && `${station.direction ? ', ' : ''}gusts ${number(station.gusts)} m/s`}
            </dd>
          </div>
        </dl>
      </div>
    </Popup>
  );
}
