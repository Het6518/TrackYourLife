import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";

// Rotating prompts so the blank page never feels like a chore — nudges
// people toward writing something specific instead of staring at "Write
// your note".
const PROMPTS = [
  "What's one moment from today you want to remember?",
  "What made today feel the way it did?",
  "Something you're grateful for today...",
  "What's one thing you'd tell yourself this morning?",
  "Anything you're proud of today?",
  "What was the hardest part of today?",
];

const MOODS = [
  { max: 3, label: "Rough day", tone: "rough" },
  { max: 6, label: "Steady day", tone: "okay" },
  { max: 10, label: "Great day", tone: "great" },
];

function moodFor(score) {
  return MOODS.find((m) => score <= m.max) || MOODS[MOODS.length - 1];
}

export default function DayComposer({ form, setForm, onSave, onDelete, error, streak, entries }) {
  const [placeholder] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef(null);
  const mood = moodFor(Number(form.score) || 5);
  const noteLength = (form.note || "").length;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(260, Math.max(96, el.scrollHeight))}px`;
  }, [form.note]);

  const encouragement = useMemo(() => {
    if (!entries) return "This is your first entry — future you will thank you.";
    if (streak >= 3) return `🔥 ${streak}-day streak — don't stop now.`;
    return `${entries} day${entries === 1 ? "" : "s"} logged so far. Keep going.`;
  }, [entries, streak]);

  async function submit(event) {
    event.preventDefault();
    await onSave(event);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  }

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-head">
        <div>
          <p className="eyebrow">{form.id ? "Editing an entry" : "Share your day"}</p>
          <p className="composer-hint">{encouragement}</p>
        </div>
        <input
          type="date"
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
          aria-label="Entry date"
          required
        />
      </div>

      <div className="composer-body">
        <textarea
          id="composer-note"
          ref={textareaRef}
          value={form.note || ""}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          maxLength="600"
          placeholder={placeholder}
          rows={3}
        />
        <span className="composer-count">{noteLength}/600</span>
      </div>

      <div className="composer-score">
        <div className="composer-score-label">
          <span>How was it?</span>
          <span className={`mood-badge ${mood.tone}`}>{mood.label}</span>
        </div>
        <div className="chips composer-chips">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
            <button
              type="button"
              key={score}
              className={`chip ${Number(form.score) === score ? "selected" : ""}`}
              onClick={() => setForm({ ...form, score })}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      <div className="composer-footer">
        <div className="chips">
          <button type="button" className={`chip wide ${form.visibility === "private" ? "selected" : ""}`} onClick={() => setForm({ ...form, visibility: "private" })}>Private</button>
          <button type="button" className={`chip wide ${form.visibility === "friends" ? "selected" : ""}`} onClick={() => setForm({ ...form, visibility: "friends" })}>Friends</button>
          <button type="button" className={`chip wide ${form.visibility === "public" ? "selected" : ""}`} onClick={() => setForm({ ...form, visibility: "public" })}>Public</button>
        </div>
        <div className="composer-actions">
          {form.id && onDelete && (
            <button type="button" className="soft-button" onClick={() => onDelete(form)}><Trash2 size={15} /> Delete</button>
          )}
          <button type="submit" className="primary">
            <Send size={15} /> {form.id ? "Update entry" : "Save entry"}
          </button>
        </div>
      </div>

      {error && <p className="error composer-error">{error}</p>}
      {justSaved && <p className="composer-saved">Saved ✓ See you tomorrow.</p>}
    </form>
  );
}
