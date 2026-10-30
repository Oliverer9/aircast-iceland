import { useEffect, useState } from 'react';
import { LEVEL_COLORS, NO_INDEX_COLOR } from './airLevels.js';
import { useText } from './i18n.jsx';

const clock = (iso) => new Date(iso).toISOString().slice(11, 16); // UTC, which Iceland uses all year

// "updated 3 min ago": re-counted every 30 seconds so it stays true while the page is open.
function useMinutesSince(iso) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);
  return iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : null;
}

// The dark band at the top: name, tagline, settings and a summary of the air right now.
export default function SiteHeader({ data, dark, onToggleDark }) {
  const { lang, setLang, t, levels } = useText();
  const minutes = useMinutesSince(data?.fetchedAt);

  const counts = new Map();
  for (const s of data?.stations ?? []) {
    const key = s.level ? s.level.index : 'none';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const summary = [
    ...levels.map((name, i) => ({ name, color: LEVEL_COLORS[i], count: counts.get(i) ?? 0 })),
    { name: t('noIndex'), color: NO_INDEX_COLOR, count: counts.get('none') ?? 0 },
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
            <p className="tagline">{t('tagline')}</p>
          </div>
        </div>

        <div className="header-side">
          <div className="settings">
            <div className="lang-switch" role="group" aria-label={t('language')}>
              <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
                English
              </button>
              <button type="button" lang="is" aria-pressed={lang === 'is'} onClick={() => setLang('is')}>
                Íslenska
              </button>
            </div>
            <button type="button" className="header-toggle" aria-pressed={dark} onClick={onToggleDark}>
              {t('darkMode')}
            </button>
          </div>

          {data && (
            <div className="summary">
              <p className="summary-title">
                {t('summaryTitle', { count: data.stations.length })} ·{' '}
                {minutes < 1
                  ? t('updatedNow', { time: clock(data.fetchedAt) })
                  : t('updatedAgo', { minutes, time: clock(data.fetchedAt) })}
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
      </div>
      {/* A soft wave along the bottom edge, in the page colour. Decorative. */}
      <svg className="header-wave" viewBox="0 0 1440 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40V22C240 2 480 2 720 18s480 20 720 0v22z" fill="currentColor" />
      </svg>
    </header>
  );
}
