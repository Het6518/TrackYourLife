// Small area/line chart used inside the flanking dashboard cards
// ("Momentum" and "View" — analogous to the reference's mini terrain charts).
export default function Sparkline({ days, area = false }) {
  const points = days.map((day, index) => {
    const x = days.length <= 1 ? 0 : (index / (days.length - 1)) * 100;
    const y = 100 - ((Number(day.score) - 1) / 9) * 100;
    return [x, y];
  });

  if (points.length < 2) {
    return <div className="sparkline-empty">Not enough data yet</div>;
  }

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const areaPath = `M0,100 L${line} L100,100 Z`;

  return (
    <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none">
      {area && <path d={areaPath} fill="url(#sparkline-fill)" stroke="none" />}
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--orange)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={line} fill="none" stroke="var(--orange)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
