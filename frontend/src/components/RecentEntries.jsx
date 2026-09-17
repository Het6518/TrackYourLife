import { shortDate } from "../utils/date";

export default function RecentEntries({ days, onSelect }) {
  return (
    <section className="panel recent-panel">
      <h2>Recent entries</h2>
      <div className="recent-list">
        {days.slice(0, 7).map((day) => (
          <button key={day.id} onClick={() => onSelect(day)}>
            <span>
              <strong>{shortDate(day.date)}</strong>
              <small>{day.note || "No note"}</small>
            </span>
            <b className={`mini-score level-${day.score}`}>{day.score}/10</b>
          </button>
        ))}
        {!days.length && <p className="empty-state">Your saved entries will appear here.</p>}
      </div>
    </section>
  );
}
