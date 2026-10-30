import { LEVEL_COLORS, LEVEL_NAMES, NO_INDEX_COLOR } from './airLevels.js';

const clock = (iso) => new Date(iso).toISOString().slice(11, 16); // UTC, which Iceland uses all year

// The dark band at the top: name, tagline and a one-line summary of the air right now.
export default function SiteHeader({ data }) {
  const counts = new Map();
  for (const s of data?.stations ?? []) {
    const key = s.level ? s.level.label : 'No index';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const summary = [
    ...LEVEL_NAMES.map((name, i) => ({ name, color: LEVEL_COLORS[i], count: counts.get(name) ?? 0 })),
    { name: 'No index', color: NO_INDEX_COLOR, count: counts.get('No index') ?? 0 },
  ].filter((item) => item.count > 0);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          {/* A cloud with wind lines: decorative, the name says what it is. */}
          <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M14 30a8 8 0 0 1 1.2-15.9A11 11 0 0 1 36 17a7 7 0 0 1-1 13.9H14z"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M8 37h22M14 42h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <h1>AirCast Iceland</h1>
            <p className="tagline">Air quality and weather in Iceland, live.</p>
          </div>
        </div>

        {data && (
          <div className="summary">
            <p className="summary-title">
              Right now at {data.stations.length} air quality stations · updated {clock(data.fetchedAt)} UTC
            </p>
            <ul className="summary-list">
              {summary.map((item) => (
                <li key={item.name}>
                  <span className="swatch" style={{ background: item.color }} aria-hidden="true" />
                  <strong>{item.count}</strong> {item.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* A soft wave along the bottom edge, in the page colour. Decorative. */}
      <svg className="header-wave" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40V22C240 2 480 2 720 18s480 20 720 0v22z" fill="currentColor" />
      </svg>
    </header>
  );
}
