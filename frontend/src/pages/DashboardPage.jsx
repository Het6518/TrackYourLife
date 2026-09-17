import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import DayModal from "../components/DayModal";
import EntryForm from "../components/EntryForm";
import RecentEntries from "../components/RecentEntries";
import Trends from "../components/Trends";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi } from "../api/client";
import { averageScore, bestStreak, todayIso } from "../utils/date";

const freshForm = (date = todayIso()) => ({ date, score: 7, note: "", is_public: false });

export default function DashboardPage({ token, user, onLogout, navigate }) {
  const [days, setDays] = useState([]);
  const [form, setForm] = useState(freshForm());
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  const today = days.find((day) => day.date === todayIso());
  const stats = useMemo(() => ({
    entries: days.length,
    average: averageScore(days),
    streak: bestStreak(days),
    publicCount: days.filter((day) => day.is_public).length,
  }), [days]);

  async function loadDays() {
    setDays(await daysApi.list(token));
  }

  useEffect(() => {
    loadDays().catch((err) => setError(err.message));
  }, []);

  function selectDate(date, day) {
    if (day) {
      setSelectedDay(day);
      return;
    }
    setSelectedDay(null);
    setForm(freshForm(date));
    document.getElementById("log-entry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editDay(day) {
    setForm({ id: day.id, date: day.date, score: day.score, note: day.note, is_public: day.is_public });
    setSelectedDay(null);
    document.getElementById("log-entry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    const payload = { date: form.date, score: form.score, note: form.note || "", is_public: Boolean(form.is_public) };
    try {
      if (form.id) await daysApi.update(form.id, payload, token);
      else await daysApi.create(payload, token);
      setForm(freshForm());
      await loadDays();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(day) {
    await daysApi.remove(day.id, token);
    setSelectedDay(null);
    setForm(freshForm());
    await loadDays();
  }

  return (
    <main className="page-shell dashboard-page">
      <AppHeader user={user} isPublic={stats.publicCount > 0} onExplore={() => navigate("explore")} onLogout={onLogout} />

      <section className="hero-board">
        <div>
          <p className="eyebrow">Your Daymap</p>
          <h1>{today ? `Today is a ${today.score}/10` : "How was today?"}</h1>
          <p>{today?.note || "Click a heatmap day to inspect it, or pick an empty date to add a new entry."}</p>
        </div>
        <div className="hero-metrics">
          <article><span>Logged</span><strong>{stats.entries}</strong></article>
          <article><span>Average</span><strong>{stats.average}</strong></article>
          <article><span>Best streak</span><strong>{stats.streak}d</strong></article>
        </div>
      </section>

      <section className="glass-panel heatmap-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Year View</p>
            <h2>{year} calendar</h2>
          </div>
          <div className="streak-pill">{stats.publicCount} public entries</div>
        </div>
        <YearHeatmap days={days} year={year} onSelectDate={selectDate} />
      </section>

      <Trends days={days} />

      <section className="dashboard-grid" id="log-entry">
        <EntryForm form={form} setForm={setForm} onSave={save} onDelete={remove} error={error} />
        <RecentEntries days={days} onSelect={setSelectedDay} />
      </section>

      <DayModal day={selectedDay} days={days} onClose={() => setSelectedDay(null)} onEdit={editDay} onSelectDay={setSelectedDay} />
    </main>
  );
}
