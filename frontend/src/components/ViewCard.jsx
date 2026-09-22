import { useMemo, useState } from "react";
import Sparkline from "./Sparkline";

// Mirrors the reference's "View" card: a Structure/Composition-style toggle
// above a chart, with Min/Current/Max readouts underneath.
export default function ViewCard({ days }) {
  const [range, setRange] = useState(7);
  const scoped = useMemo(() => [...days].slice(0, range).reverse(), [days, range]);
  const scores = scoped.map((day) => Number(day.score));
  const min = scores.length ? Math.min(...scores) : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const current = scores.length ? scores[scores.length - 1] : 0;

  return (
    <section className="orbit-card view-card">
      <div className="orbit-head">
        <h3>Score trend</h3>
        <div className="view-toggle">
          <button type="button" className={range === 7 ? "active" : ""} onClick={() => setRange(7)}>7d</button>
          <button type="button" className={range === 30 ? "active" : ""} onClick={() => setRange(30)}>30d</button>
        </div>
      </div>
      <div className="momentum-chart">
        <Sparkline days={scoped} area />
      </div>
      <div className="view-stats">
        <div><span>Min</span><b>{scores.length ? min : "—"}</b></div>
        <div><span>Current</span><b>{scores.length ? current : "—"}</b></div>
        <div><span>Max</span><b>{scores.length ? max : "—"}</b></div>
      </div>
    </section>
  );
}
