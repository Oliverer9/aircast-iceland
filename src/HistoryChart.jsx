import { useLayoutEffect, useRef, useState } from 'react';
import { useApi } from './useApi.js';
import { useText } from './i18n.jsx';

// The last 24 hours for the chosen station: one pollutant at a time, picked with the buttons.
// One line, so no legend: the title names it. Hover (or touch) shows the exact hour and
// value; the same numbers are in a table underneath for anyone who can't use the chart.

const HEIGHT = 140;
const MARGIN = { top: 12, right: 12, bottom: 22, left: 40 };
const clock = (time) => time.slice(11, 16);

// A round number just above the highest value, so the axis reads nicely.
function niceMax(value) {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * step >= value * 1.1) return m * step;
  return 10 * step;
}

// The chart's width in pixels. Measured straight away, not only when the ResizeObserver
// first reports, because that waits for a drawn frame and never comes in a background tab.
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    setWidth(Math.floor(ref.current.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function LineChart({ reading, label }) {
  const { t, number } = useText();
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const points = reading.points;

  const values = points.map((p) => p.value);
  const yMax = niceMax(Math.max(...values));
  const plotW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const x = (i) => MARGIN.left + (points.length === 1 ? 0 : (i / (points.length - 1)) * plotW);
  const y = (v) => MARGIN.top + plotH - (v / yMax) * plotH;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const last = points.length - 1;
  const xTicks = [0, Math.round(last / 2), last];

  function onPointerMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const i = Math.round(((px - MARGIN.left) / plotW) * last);
    setHover(Math.min(last, Math.max(0, i)));
  }

  const summary = t('chartSummary', {
    label,
    min: number(Math.min(...values)),
    max: number(Math.max(...values)),
    now: number(values[last]),
    unit: reading.unit,
  });

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={summary}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          {[0, yMax / 2, yMax].map((v) => (
            <g key={v}>
              <line className="chart-grid" x1={MARGIN.left} x2={width - MARGIN.right} y1={y(v)} y2={y(v)} />
              <text className="chart-axis" x={MARGIN.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle">
                {number(v)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} className="chart-axis" x={x(i)} y={HEIGHT - 4} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>
              {clock(points[i].time)}
            </text>
          ))}
          <path className="chart-line" d={path} />
          <circle className="chart-dot" cx={x(last)} cy={y(values[last])} r="4" />
          {hover !== null && (
            <g>
              <line className="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={MARGIN.top + plotH} />
              <circle className="chart-dot" cx={x(hover)} cy={y(values[hover])} r="4" />
            </g>
          )}
        </svg>
      )}
      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{ left: Math.min(Math.max(x(hover), 60), width - 60), top: Math.max(0, y(values[hover]) - 46) }}
          aria-hidden="true"
        >
          <strong>
            {number(values[hover])} {reading.unit}
          </strong>
          <span>{clock(points[hover].time)} UTC</span>
        </div>
      )}
    </div>
  );
}

export default function HistoryChart({ stationId }) {
  const { t, pollutantName, number } = useText();
  const { status, data } = useApi(`/api/history/${stationId}`);
  const [code, setCode] = useState(null);

  if (status === 'loading') return <p className="muted small">{t('historyLoading')}</p>;
  if (status === 'error' || !data?.readings.length) return <p className="muted small">{t('historyError')}</p>;

  const reading = data.readings.find((r) => r.code === code) ?? data.readings[0];
  const label = pollutantName(reading.code);

  return (
    <div className="history">
      <div className="chip-row" role="group" aria-label={t('last24h')}>
        {data.readings.map((r) => (
          <button key={r.code} type="button" className="chip" aria-pressed={r.code === reading.code} onClick={() => setCode(r.code)}>
            {r.code}
          </button>
        ))}
      </div>
      <p className="chart-title">
        {label} <span className="muted">({reading.unit})</span>
      </p>
      <LineChart reading={reading} label={label} />
      <details className="chart-table">
        <summary>{t('showTable')}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('time')}</th>
              <th scope="col">
                {t('value')} ({reading.unit})
              </th>
            </tr>
          </thead>
          <tbody>
            {reading.points.map((p) => (
              <tr key={p.time}>
                <td>{clock(p.time)}</td>
                <td>{number(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
