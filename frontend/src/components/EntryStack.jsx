import { shortDate } from "../utils/date";

export default function EntryStack({ entries, onSelect, empty = "Your saved entries will appear here." }) {
  const items = entries.slice(0, 3);
  if (!items.length) return <div className="stack-empty">{empty}</div>;

  return (
    <div className="stack">
      {[...items].reverse().map((day, index) => (
        <button key={day.id} className={`stack-card level-${day.score}`} style={{ zIndex: index + 1 }} onClick={() => onSelect(day)}>
          <span className="stack-tag">{String(items.length - index).padStart(2, "0")}</span>
          <span className="stack-body">
            <small>{shortDate(day.date)}</small>
            <em>{day.note || "No note"}</em>
          </span>
          <strong>{day.score}<i>/10</i></strong>
        </button>
      ))}
    </div>
  );
}
