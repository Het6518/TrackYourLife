import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { formatDate } from "../utils/date";

export default function DayModal({ day, days, onClose, onEdit, onSelectDay }) {
  if (!day) return null;

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const index = sorted.findIndex((entry) => entry.id === day.id);
  const previous = index > 0 ? sorted[index - 1] : null;
  const next = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className="day-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-top">
          <div>
            <p className="eyebrow">Day Detail</p>
            <h2>{formatDate(day.date)}</h2>
          </div>
          <button className="soft-button" onClick={onClose}>Close</button>
        </div>

        <div className="modal-score-row">
          <strong className={`score-orb level-${day.score}`}>{day.score}</strong>
          <div>
            <span>out of 10</span>
            <p>{day.is_public ? "Visible on public Daymaps" : "Private entry"}</p>
          </div>
        </div>

        <div className="note-detail">
          <p className="field-label">Note</p>
          <p>{day.note || "No note for this day."}</p>
        </div>

        <div className="modal-actions">
          <button className="soft-button" disabled={!previous} onClick={() => onSelectDay(previous)}>
            <ChevronLeft size={16} /> Previous
          </button>
          {onEdit && (
            <button className="primary small" onClick={() => onEdit(day)}>
              <Pencil size={15} /> Edit
            </button>
          )}
          <button className="soft-button" disabled={!next} onClick={() => onSelectDay(next)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </article>
    </div>
  );
}
