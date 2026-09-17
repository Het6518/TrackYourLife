import { Save, Trash2 } from "lucide-react";
import { shortDate, todayIso } from "../utils/date";

const scoreValues = Array.from({ length: 10 }, (_, index) => index + 1);

export default function EntryForm({ form, setForm, onSave, onDelete, error }) {
  const isEditing = Boolean(form.id);

  return (
    <section className="glass-panel log-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Daily Log</p>
          <h2>{isEditing ? `Editing ${shortDate(form.date)}` : "Capture a day"}</h2>
        </div>
        {isEditing && (
          <button type="button" className="danger-button" onClick={() => onDelete(form)} title="Delete entry">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <form onSubmit={onSave} className="entry-form">
        <label>
          <span>Date</span>
          <input type="date" value={form.date || todayIso()} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
        </label>

        <div className="score-picker">
          <span className="field-label">Score</span>
          <div className="score-buttons">
            {scoreValues.map((score) => (
              <button
                type="button"
                key={score}
                className={`score-button level-${score} ${Number(form.score) === score ? "selected" : ""}`}
                onClick={() => setForm({ ...form, score })}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        <label>
          <span>Note</span>
          <textarea
            value={form.note || ""}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            rows="7"
            maxLength="600"
            placeholder="What changed your score today?"
          />
        </label>

        <label className="checkbox-row">
          <input type="checkbox" checked={Boolean(form.is_public)} onChange={(event) => setForm({ ...form, is_public: event.target.checked })} />
          Share this entry publicly
        </label>

        {error && <p className="error">{error}</p>}
        <button className="primary full" type="submit">
          <Save size={16} /> Save entry
        </button>
      </form>
    </section>
  );
}
