const scoreValues = Array.from({ length: 10 }, (_, index) => index + 1);

export default function ScoreCard({ form, setForm, week }) {
  return (
    <section className="styles-card">
      <div className="styles-head">
        <h3>Choose score</h3>
        <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} aria-label="Entry date" required />
      </div>
      <div className="chips">
        {scoreValues.map((score) => (
          <button type="button" key={score} className={`chip ${Number(form.score) === score ? "selected" : ""}`} onClick={() => setForm({ ...form, score })}>
            {score}
          </button>
        ))}
        <button type="button" className={`chip wide ${!form.is_public ? "selected" : ""}`} onClick={() => setForm({ ...form, is_public: false })}>Private</button>
        <button type="button" className={`chip wide ${form.is_public ? "selected" : ""}`} onClick={() => setForm({ ...form, is_public: true })}>Public</button>
      </div>
      <div className="pager" title="Days logged in the last week">
        {week.map((logged, index) => <span key={index} className={logged ? "on" : ""} />)}
      </div>
    </section>
  );
}
