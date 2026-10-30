import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Moving streaks that follow the wind measured right now at Veðurstofa's stations.
//
// 1. Spread the station readings over a grid covering Iceland. Each grid point gets an
//    average of the stations near it, where closer stations count more (inverse distance
//    weighting). Points more than MAX_DISTANCE_KM from any station get no wind, so the
//    streaks stay over land and near the coast instead of inventing wind out at sea.
// 2. Scatter particles on the map. Every frame each one moves a little in the wind at its
//    spot, and the canvas fades slightly, which leaves a short trail behind each particle.

const GRID = { south: 63.2, north: 66.6, west: -24.6, east: -13.4, latStep: 0.05, lonStep: 0.1 };
const MAX_DISTANCE_KM = 40;
const PIXELS_PER_MS = 0.12; // how far a particle moves per frame for each m/s of wind
const MAX_AGE = 90; // frames before a particle starts again somewhere else

function distanceKm(lat1, lon1, lat2, lon2) {
  // Flat-earth approximation; plenty accurate over 40 km.
  const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180)) * 111.32;
  const dy = (lat2 - lat1) * 110.57;
  return Math.hypot(dx, dy);
}

function buildWindGrid(wind) {
  const rows = Math.round((GRID.north - GRID.south) / GRID.latStep) + 1;
  const cols = Math.round((GRID.east - GRID.west) / GRID.lonStep) + 1;
  const u = new Float32Array(rows * cols).fill(NaN); // east-west, m/s
  const v = new Float32Array(rows * cols).fill(NaN); // north-south, m/s

  // The API gives the direction the wind comes FROM, so it blows the opposite way.
  const vectors = wind.map((w) => {
    const rad = (w.from * Math.PI) / 180;
    return { lat: w.lat, lon: w.lon, u: -w.speed * Math.sin(rad), v: -w.speed * Math.cos(rad) };
  });

  for (let r = 0; r < rows; r++) {
    const lat = GRID.south + r * GRID.latStep;
    for (let c = 0; c < cols; c++) {
      const lon = GRID.west + c * GRID.lonStep;
      let weightSum = 0;
      let uSum = 0;
      let vSum = 0;
      for (const s of vectors) {
        const d = distanceKm(lat, lon, s.lat, s.lon);
        if (d > MAX_DISTANCE_KM) continue;
        const weight = 1 / Math.max(d, 1) ** 2;
        weightSum += weight;
        uSum += s.u * weight;
        vSum += s.v * weight;
      }
      if (weightSum > 0) {
        u[r * cols + c] = uSum / weightSum;
        v[r * cols + c] = vSum / weightSum;
      }
    }
  }
  return { rows, cols, u, v };
}

function windAt(grid, lat, lon) {
  const r = Math.round((lat - GRID.south) / GRID.latStep);
  const c = Math.round((lon - GRID.west) / GRID.lonStep);
  if (r < 0 || r >= grid.rows || c < 0 || c >= grid.cols) return null;
  const i = r * grid.cols + c;
  return Number.isNaN(grid.u[i]) ? null : { u: grid.u[i], v: grid.v[i] };
}

export default function WindLayer({ wind, color }) {
  const map = useMap();

  useEffect(() => {
    const grid = buildWindGrid(wind);

    // Its own pane, between the map tiles (200) and the station markers (600).
    const pane = map.getPane('wind') ?? map.createPane('wind');
    pane.style.zIndex = 450;
    pane.style.pointerEvents = 'none';

    const canvas = L.DomUtil.create('canvas', 'wind-canvas', pane);
    const ctx = canvas.getContext('2d');
    let particles = [];
    let frame = null;

    function spawn(size) {
      // Try a few random spots and keep one that has wind.
      for (let tries = 0; tries < 10; tries++) {
        const x = Math.random() * size.x;
        const y = Math.random() * size.y;
        const { lat, lng } = map.containerPointToLatLng([x, y]);
        if (windAt(grid, lat, lng)) return { x, y, age: Math.floor(Math.random() * MAX_AGE) };
      }
      return { x: 0, y: 0, age: MAX_AGE };
    }

    // Start over whenever the map moves, zooms or changes size.
    function reset() {
      const size = map.getSize();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = size.x * ratio;
      canvas.height = size.y * ratio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // The pane moves with the map when dragged; this keeps the canvas over the visible area.
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
      particles = Array.from({ length: Math.round((size.x * size.y) / 450) }, () => spawn(size));
      canvas.style.visibility = 'visible';
    }

    function step() {
      const size = map.getSize();

      // Fade what was drawn before, so each particle leaves a short trail.
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.93)';
      ctx.fillRect(0, 0, size.x, size.y);
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const p of particles) {
        if (p.age++ > MAX_AGE) {
          Object.assign(p, spawn(size), { age: 0 });
          continue;
        }
        const { lat, lng } = map.containerPointToLatLng([p.x, p.y]);
        const w = windAt(grid, lat, lng);
        if (!w) {
          p.age = MAX_AGE + 1;
          continue;
        }
        const x = p.x + w.u * PIXELS_PER_MS;
        const y = p.y - w.v * PIXELS_PER_MS; // screen y grows downwards, north is up
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x, y);
        p.x = x;
        p.y = y;
      }
      ctx.stroke();
      frame = requestAnimationFrame(step);
    }

    const hide = () => {
      canvas.style.visibility = 'hidden';
    };
    map.on('movestart zoomstart', hide);
    map.on('moveend zoomend resize', reset);

    reset();
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      map.off('movestart zoomstart', hide);
      map.off('moveend zoomend resize', reset);
      canvas.remove();
    };
  }, [map, wind, color]);

  return null;
}
