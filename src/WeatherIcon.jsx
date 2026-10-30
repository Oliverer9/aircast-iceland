// Small drawn icons for the forecast's weather types. Decorative: the condition is always
// written next to the icon, so screen readers get the words, not a picture description.

// Roughly when it's light in Reykjavík each month, in UTC hours [sunrise, sunset].
// Good enough to choose between a sun and a moon; not exact for the whole country.
const DAYLIGHT = [
  [11, 16], [9, 18], [8, 19], [6, 21], [4, 23], [3, 24],
  [4, 23], [5, 21], [7, 20], [8, 18], [10, 16], [11, 15],
];

export function isNight(time) {
  const month = Number(time.slice(5, 7)) - 1;
  const hour = Number(time.slice(11, 13));
  const [rise, set] = DAYLIGHT[month];
  return hour < rise || hour >= set;
}

const CLOUD = 'M11 31a6 6 0 0 1-.6-12 9 9 0 0 1 17.4-2.4A6.8 6.8 0 0 1 29 31z';

function Sun({ x = 20, y = 20, r = 6 }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
    const rad = (a * Math.PI) / 180;
    return (
      <line
        key={a}
        className="wi-sun-ray"
        x1={x + Math.cos(rad) * (r + 3)}
        y1={y + Math.sin(rad) * (r + 3)}
        x2={x + Math.cos(rad) * (r + 6)}
        y2={y + Math.sin(rad) * (r + 6)}
      />
    );
  });
  return (
    <g>
      {rays}
      <circle className="wi-sun" cx={x} cy={y} r={r} />
    </g>
  );
}

function Moon({ x = 20, y = 20, r = 8 }) {
  // A crescent: a circle with a bite taken out of its upper right.
  return (
    <path
      className="wi-moon"
      d={`M${x + r * 0.35} ${y - r} A${r} ${r} 0 1 0 ${x + r} ${y + r * 0.35} A${r * 0.75} ${r * 0.75} 0 0 1 ${x + r * 0.35} ${y - r}z`}
    />
  );
}

function SkyLight({ night, x, y, r }) {
  return night ? <Moon x={x} y={y} r={r + 1} /> : <Sun x={x} y={y} r={r} />;
}

function Cloud({ dy = 0 }) {
  return <path className="wi-cloud" d={CLOUD} transform={`translate(0 ${dy})`} />;
}

const drops = (xs, y) => xs.map((x) => <line key={x} className="wi-rain" x1={x} y1={y} x2={x - 2} y2={y + 5} />);
// A snowflake: three short crossing lines, so it doesn't read as dots or "…".
const flakes = (xs, y) =>
  xs.map((x) => (
    <g key={x} className="wi-snow">
      {[0, 60, 120].map((a) => {
        const rad = (a * Math.PI) / 180;
        const dx = Math.cos(rad) * 2.6;
        const dy = Math.sin(rad) * 2.6;
        return <line key={a} x1={x - dx} y1={y + 3 - dy} x2={x + dx} y2={y + 3 + dy} />;
      })}
    </g>
  ));

export default function WeatherIcon({ type, time }) {
  const night = isNight(time);
  let content;
  switch (type) {
    case 'clear':
      content = <SkyLight night={night} x={20} y={20} r={7} />;
      break;
    case 'partly-cloudy':
      content = (
        <>
          <SkyLight night={night} x={26} y={13} r={5} />
          <Cloud dy={3} />
        </>
      );
      break;
    case 'showers':
      content = (
        <>
          <SkyLight night={night} x={27} y={11} r={4} />
          <Cloud dy={-3} />
          {drops([15, 23], 31)}
        </>
      );
      break;
    case 'rain':
      content = (
        <>
          <Cloud dy={-4} />
          {drops([13, 20, 27], 30)}
        </>
      );
      break;
    case 'sleet':
      content = (
        <>
          <Cloud dy={-4} />
          {drops([14], 30)}
          {flakes([21, 27], 30)}
        </>
      );
      break;
    case 'snow':
      content = (
        <>
          <Cloud dy={-4} />
          {flakes([13, 20, 27], 30)}
        </>
      );
      break;
    case 'thunder':
      content = (
        <>
          <Cloud dy={-4} />
          <path className="wi-bolt" d="M21 27l-4 7h4l-2 6 6-9h-4l2-4z" />
        </>
      );
      break;
    case 'fog':
      content = (
        <>
          <Cloud dy={-6} />
          {[28, 32, 36].map((y) => (
            <line key={y} className="wi-fog" x1={y === 32 ? 9 : 12} y1={y} x2={y === 32 ? 31 : 28} y2={y} />
          ))}
        </>
      );
      break;
    default:
      content = <Cloud />;
  }
  return (
    <svg className="weather-icon" viewBox="0 0 40 40" aria-hidden="true">
      {content}
    </svg>
  );
}
