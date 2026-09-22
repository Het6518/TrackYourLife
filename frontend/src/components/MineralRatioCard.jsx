import { Download } from "lucide-react";
import Gauge from "./Gauge";

// Mirrors the reference's "Mineral Ratio" card: a half-circle gauge with a
// two-color legend, here showing your public vs. private entry split, plus
// the report/export action ("Generate Report" in the reference).
export default function MineralRatioCard({ days, onExport }) {
  const total = days.length;
  const publicCount = days.filter((day) => day.visibility === "public").length;
  const friendsCount = days.filter((day) => day.visibility === "friends").length;
  const privateCount = total - publicCount - friendsCount;
  const pct = total ? (publicCount / total) * 100 : 0;

  return (
    <section className="orbit-card ratio-card">
      <div className="orbit-head">
        <h3>Public ratio</h3>
      </div>
      <div className="gauge-wrap half">
        <Gauge value={pct} max={100} size={150} stroke={14} half />
        <div className="gauge-center half">
          <strong>{total ? Math.round(pct) : 0}%</strong>
        </div>
      </div>
      <div className="ratio-legend three">
        <span><i className="dot level-3" /> Private · {privateCount}</span>
        <span><i className="dot level-6" /> Friends · {friendsCount}</span>
        <span><i className="dot level-9" /> Public · {publicCount}</span>
      </div>
      <button type="button" className="primary full" onClick={onExport}>
        <Download size={16} /> Generate report
      </button>
    </section>
  );
}
