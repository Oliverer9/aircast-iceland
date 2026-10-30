// European Air Quality Index (European Environment Agency), based on hourly values in µg/m³.
// Source: https://airindex.eea.europa.eu/AQI/index.html
// Each number is the upper limit of a level. Above the last one is "Extremely poor".
// The EEA writes the bands as whole numbers (0-5, 6-15…), so a value between them (5.5)
// goes to the first level whose upper limit it doesn't exceed.

export const LEVELS = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor', 'Extremely poor'];

const UPPER_LIMITS = {
  'PM2.5': [5, 15, 50, 90, 140],
  PM10: [15, 45, 120, 195, 270],
  NO2: [10, 25, 60, 100, 150],
  O3: [60, 100, 120, 160, 180],
  SO2: [20, 40, 125, 190, 275],
};

// Returns { index, label, scale } or null for pollutants the index doesn't cover (H2S, PM1, CO).
// scale is 0–1: how far along the six levels the value is, for drawing a bar.
export function airLevel(code, value) {
  const limits = UPPER_LIMITS[code];
  if (!limits) return null;

  let index = limits.findIndex((limit) => value <= limit);
  if (index === -1) index = limits.length;

  const low = index === 0 ? 0 : limits[index - 1];
  // The last level has no upper limit; treat one more step of the same size as full.
  const high = limits[index] ?? limits.at(-1) + (limits.at(-1) - limits.at(-2));
  const withinLevel = Math.min(1, (value - low) / (high - low));

  return { index, label: LEVELS[index], scale: (index + withinLevel) / LEVELS.length };
}
