export default function Trends({ days }) {
  const recent = [...days].slice(0, 30).reverse();
  const points = recent.map((day, index) => {
    const x = recent.length <= 1 ? 0 : (index / (recent.length - 1)) * 100;
    const y = 100 - ((Number(day.score) - 1) / 9) * 100;
    return `${x},${y}`;
  });

  return (
    <section className="glass-panel trends-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Signal</p>
          <h2>Last 30 entries</h2>
        </div>
        <span className="streak-pill">Score trend</span>
      </div>
      {points.length > 1 ? (
        <svg className="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Recent score trend">
          <polyline points={points.join(" ")} fill="none" stroke="#14b8a6" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <div className="empty-chart">Add a few entries to see your trend.</div>
      )}
    </section>
  );
}
