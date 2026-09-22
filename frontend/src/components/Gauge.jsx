// Reusable ring/arc gauge (full circle or half circle), styled after the
// "Solar activity" / "Mineral Ratio" dials in the reference dashboard.
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export default function Gauge({ value, max = 100, size = 140, stroke = 12, half = false, color = "var(--orange)" }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke;
  const pct = max ? Math.max(0, Math.min(1, value / max)) : 0;
  const [startAngle, endAngle] = half ? [-90, 90] : [0, 359.99];
  const progressEnd = startAngle + (endAngle - startAngle) * pct;
  const viewBoxHeight = half ? size / 2 + stroke : size;

  return (
    <svg className="gauge" width={size} height={viewBoxHeight} viewBox={`0 0 ${size} ${viewBoxHeight}`}>
      <path d={describeArc(cx, cy, r, startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} strokeLinecap="round" />
      {pct > 0 && (
        <path d={describeArc(cx, cy, r, startAngle, progressEnd)} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      )}
    </svg>
  );
}
