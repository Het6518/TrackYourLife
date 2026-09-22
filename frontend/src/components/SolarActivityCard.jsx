import Gauge from "./Gauge";

// Mirrors the reference's "Solar activity" card: a radial gauge with a
// mood badge, sized to today's logged score.
export default function SolarActivityCard({ today }) {
  const score = today?.score ?? null;
  const pct = score != null ? (score / 10) * 100 : 0;
  const mood = score == null ? "No entry yet" : score >= 7 ? "Great day" : score >= 4 ? "Steady" : "Rough day";
  const moodClass = score == null ? "" : score >= 7 ? "great" : score >= 4 ? "okay" : "rough";

  return (
    <section className="orbit-card">
      <div className="orbit-head">
        <h3>Today's score</h3>
      </div>
      <div className="gauge-wrap">
        <Gauge value={pct} max={100} size={140} stroke={12} />
        <div className="gauge-center">
          <strong>{score != null ? score : "—"}<i>/10</i></strong>
          <span className={`mood-badge ${moodClass}`}>{mood}</span>
        </div>
      </div>
    </section>
  );
}
