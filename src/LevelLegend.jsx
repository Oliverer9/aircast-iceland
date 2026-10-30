import { LEVEL_COLORS, NO_INDEX_COLOR } from './airLevels.js';
import { useText } from './i18n.jsx';

// The six levels as one segmented scale, each segment named underneath, plus grey for
// stations the index doesn't cover.
export default function LevelLegend() {
  const { t, levels } = useText();
  return (
    <div className="legend">
      <h3 id="legend-heading">{t('legendTitle')}</h3>
      <ol className="scale" aria-labelledby="legend-heading">
        {levels.map((name, i) => (
          <li key={name}>
            <span className="scale-colour" style={{ background: LEVEL_COLORS[i] }} aria-hidden="true" />
            <span className="scale-name">{name}</span>
          </li>
        ))}
      </ol>
      <p className="legend-note small muted">
        <span className="swatch" style={{ background: NO_INDEX_COLOR }} aria-hidden="true" />
        {t('legendNoIndex')}
      </p>
    </div>
  );
}
