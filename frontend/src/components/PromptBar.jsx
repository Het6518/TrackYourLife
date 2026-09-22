import { Trash2 } from "lucide-react";
import StarMark from "./StarMark";

export default function PromptBar({ form, setForm, onSave, onDelete, error }) {
  return (
    <form className="prompt-wrap" onSubmit={onSave}>
      {error && <p className="error prompt-error">{error}</p>}
      <div className="prompt-bar">
        <button type="submit" className="prompt-send" title={form.id ? "Update entry" : "Save entry"} aria-label="Save entry"><StarMark size={18} /></button>
        <input
          id="prompt-input"
          value={form.note || ""}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          maxLength="600"
          placeholder={form.id ? "Edit your note" : "Write your note"}
        />
        {form.id && (
          <button type="button" className="prompt-delete" onClick={() => onDelete(form)} title="Delete entry" aria-label="Delete entry"><Trash2 size={15} /></button>
        )}
      </div>
    </form>
  );
}
