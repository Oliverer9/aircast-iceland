import { LEVEL_COLORS, LEVEL_NAMES, NO_INDEX_COLOR } from './airLevels.js';

export default function LevelLegend() {
  return (
    <div className="legend">
      <h3 id="legend-heading">Levels (European Air Quality Index)</h3>
      <ul aria-labelledby="legend-heading">
        {LEVEL_NAMES.map((name, i) => (
          <li key={name}>
            <span className="swatch" style={{ background: LEVEL_COLORS[i] }} aria-hidden="true" />
            {name}
          </li>
        ))}
        <li>
          <span className="swatch" style={{ background: NO_INDEX_COLOR }} aria-hidden="true" />
          No index (only measures gases the index doesn't cover, like H₂S)
        </li>
      </ul>
    </div>
  );
}
