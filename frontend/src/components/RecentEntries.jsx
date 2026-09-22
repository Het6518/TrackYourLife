import { useEffect, useState } from "react";
import Pagination, { paginate } from "./Pagination";
import { shortDate } from "../utils/date";

const PAGE_SIZE = 6;

export default function RecentEntries({ days, onSelect }) {
  const [page, setPage] = useState(1);
  const { pageItems, pageCount, safePage } = paginate(days, page, PAGE_SIZE);

  useEffect(() => setPage(1), [days.length]); // jump back to page 1 whenever the underlying list changes (new search, new entry, etc.)

  return (
    <section className="panel recent-panel">
      <div className="section-heading">
        <h2>Recent entries</h2>
      </div>
      <div className="recent-list">
        {pageItems.map((day) => (
          <button key={day.id} onClick={() => onSelect(day)}>
            <span>
              <strong>{shortDate(day.date)}</strong>
              <small>{day.note || "No note"}</small>
            </span>
            <b className={`mini-score level-${day.score}`}>{day.score}/10</b>
          </button>
        ))}
        {!days.length && <p className="empty-state">No matching entries.</p>}
      </div>
      <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
    </section>
  );
}
