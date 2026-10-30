import { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Pane, TileLayer, Tooltip, useMap, useMapEvent } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { levelColor } from './airLevels.js';
import { useText } from './i18n.jsx';
import WindLayer from './WindLayer.jsx';
import ClickWeather from './ClickWeather.jsx';

function markerIcon(station, selected) {
  const size = selected ? 34 : 24;
  return L.divIcon({
    className: 'station-marker-wrap',
    html: `<span class="station-marker${selected ? ' selected' : ''}" style="background:${levelColor(station.level)}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// The whole country, used as the starting view.
const ICELAND = [
  [63.2, -24.6],
  [66.6, -13.4],
];
// How far the map can be dragged: Iceland plus half its size again on every side.
const DRAG_LIMIT = L.latLngBounds(ICELAND).pad(0.5);

// Radius of the faint pollution cloud around each station. A station measures the air
// where it stands, so this only hints at the area around it. Zoomed out, 5 km is a few
// pixels and would hide under the marker, so the cloud never gets smaller than
// CLOUD_MIN_PX on screen.
const CLOUD_RADIUS_M = 5000;
const CLOUD_MIN_PX = 30;

// Metres covered by one screen pixel at this latitude and zoom (Web Mercator).
const metresPerPixel = (lat, zoom) => (40075016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);

// Clouds are strongest at the country view and fade as you zoom in, so streets and names
// stay readable up close: 0.35 up to zoom 7, then 0.06 less per zoom step, never below 0.12.
const cloudOpacity = (zoom) => Math.max(0.12, Math.min(0.35, 0.35 - (zoom - 7) * 0.06));

function PollutionClouds({ stations }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvent('zoomend', () => setZoom(map.getZoom()));

  return stations
    .filter((s) => s.level)
    .map((s) => (
      <Circle
        key={s.id}
        center={[s.lat, s.lon]}
        radius={Math.max(CLOUD_RADIUS_M, CLOUD_MIN_PX * metresPerPixel(s.lat, zoom))}
        interactive={false}
        pathOptions={{ stroke: false, fillColor: levelColor(s.level), fillOpacity: cloudOpacity(zoom) }}
      />
    ));
}

// Leaflet measures the map box once, when it is created. If the box changes size later
// (layout settling, window resized, columns stacking on a narrow screen), Leaflet doesn't
// notice and leaves grey gaps. So: re-measure whenever the box changes size, and fit
// the stations the first time the box has a real size.
function KeepSizedAndFitted({ stations }) {
  const map = useMap();
  useEffect(() => {
    let fitted = false;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      const { x, y } = map.getSize();
      if (!fitted && x > 0 && y > 0 && stations.length) {
        map.fitBounds(stations.map((s) => [s.lat, s.lon]), { padding: [30, 30] });
        fitted = true;
      }
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, stations]);
  return null;
}

// Moves the map to a station when "Near me" finds one. Flies there, unless the visitor has
// asked for less motion, in which case it jumps.
function MoveToFocus({ focus, stations }) {
  const map = useMap();
  useEffect(() => {
    const station = focus && stations.find((s) => s.id === focus.id);
    if (!station) return;
    const zoom = Math.max(map.getZoom(), 10);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.setView([station.lat, station.lon], zoom);
    else map.flyTo([station.lat, station.lon], zoom, { duration: 1 });
  }, [map, focus, stations]);
  return null;
}

export default function StationMap({ stations, wind, weatherStations, showWind, dark, selectedId, focus, onSelect }) {
  const { lang, levelName } = useText();
  const icons = useMemo(
    () => new Map(stations.map((s) => [s.id, markerIcon(s, s.id === selectedId)])),
    [stations, selectedId],
  );

  return (
    <MapContainer
      className="map"
      bounds={ICELAND}
      maxBounds={DRAG_LIMIT}
      maxBoundsViscosity={0.8}
      minZoom={5}
      zoomSnap={0.5}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <KeepSizedAndFitted stations={stations} />
      {/* Faint blurred clouds in each station's level colour, under the wind and markers.
          Stations without an index get none, so no colour is made up for them. */}
      <Pane name="pollution" className="pollution-pane">
        <PollutionClouds stations={stations} />
      </Pane>
      {/* Light streaks on the dark map, dark streaks on the light one. */}
      {showWind && <WindLayer wind={wind} color={dark ? 'rgba(225, 235, 245, 0.85)' : 'rgba(20, 30, 50, 0.85)'} />}
      <ClickWeather weatherStations={weatherStations} />
      <MoveToFocus focus={focus} stations={stations} />
      {stations.map((s) => (
        <Marker
          // Leaflet only reads the title when a marker is made, so a new language makes new markers.
          key={`${s.id}-${lang}`}
          position={[s.lat, s.lon]}
          icon={icons.get(s.id)}
          title={`${s.name}: ${levelName(s.level)}`}
          zIndexOffset={s.id === selectedId ? 1000 : 0}
          eventHandlers={{
            click: () => onSelect(s.id),
            // Markers are focusable buttons, but Leaflet doesn't select them on Enter or Space.
            keydown: (e) => {
              if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                e.originalEvent.preventDefault();
                onSelect(s.id);
              }
            },
          }}
        >
          <Tooltip>
            {s.name}: {levelName(s.level)}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
