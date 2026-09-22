import Sparkline from "./Sparkline";

// Mirrors the reference's "3D Projection" card: a compact chart sitting
// under the main gauge, here showing your most recent week of scores.
export default function MomentumCard({ days }) {
  const recent = [...days].slice(0, 7).reverse();

  return (
    <section className="orbit-card">
      <div className="orbit-head">
        <h3>This week</h3>
      </div>
      <div className="momentum-chart">
        <Sparkline days={recent} area />
      </div>
      <p className="momentum-caption">{recent.length ? `${recent.length} of the last 7 days logged` : "Log a few days to see momentum"}</p>
    </section>
  );
}
