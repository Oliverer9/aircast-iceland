import { LEVEL_COLORS, LEVEL_NAMES, NO_INDEX_COLOR } from './airLevels.js';

// The six levels as one segmented scale, each segment named underneath, plus grey for
// stations the index doesn't cover.
export default function LevelLegend() {
  return (
    <div className="legend">
      <h3 id="legend-heading">Levels (European Air Quality Index)</h3>
      <ol className="scale" aria-labelledby="legend-heading">
        {LEVEL_NAMES.map((name, i) => (
          <li key={name}>
            <span className="scale-colour" style={{ background: LEVEL_COLORS[i] }} aria-hidden="true" />
            <span className="scale-name">{name}</span>
          </li>
        ))}
      </ol>
      <p className="legend-note small muted">
        <span className="swatch" style={{ background: NO_INDEX_COLOR }} aria-hidden="true" />
        No index: the station only measures gases the index doesn't cover, like H₂S.
      </p>
    </div>
  );
}
