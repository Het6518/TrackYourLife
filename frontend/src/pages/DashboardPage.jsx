import { useEffect, useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import DayComposer from "../components/DayComposer";
import DayModal from "../components/DayModal";
import EntryStack from "../components/EntryStack";
import InspireCard from "../components/InspireCard";
import MineralRatioCard from "../components/MineralRatioCard";
import MomentumCard from "../components/MomentumCard";
import RecentEntries from "../components/RecentEntries";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import SolarActivityCard from "../components/SolarActivityCard";
import Trends from "../components/Trends";
import ViewCard from "../components/ViewCard";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi } from "../api/client";
import { averageScore, bestStreak, todayIso, truncateNote } from "../utils/date";
import { downloadCsv } from "../utils/export";

const freshForm = (date = todayIso()) => ({ date, score: 7, note: "", visibility: "private" });

export default function DashboardPage({ token, user, onLogout, onUserChange, navigate, weather }) {
  const [days, setDays] = useState([]);
  const [publicUsers, setPublicUsers] = useState([]);
  const [form, setForm] = useState(freshForm());
  const [selectedDay, setSelectedDay] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  const today = days.find((day) => day.date === todayIso());
  const stats = useMemo(() => ({
    entries: days.length,
    average: averageScore(days),
    streak: bestStreak(days),
    publicCount: days.filter((day) => day.visibility === "public").length,
  }), [days]);

  const sortedByDate = useMemo(() => [...days].sort((a, b) => b.date.localeCompare(a.date)), [days]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return days;
    return days.filter((day) => day.note.toLowerCase().includes(term) || day.date.includes(term));
  }, [days, query]);

  async function loadDays() {
    setDays(await daysApi.list(token));
  }

  useEffect(() => {
    loadDays().catch((err) => setError(err.message));
    daysApi.publicUsers().then(setPublicUsers).catch(() => setPublicUsers([]));
  }, []);

  function focusPrompt() {
    const el = document.getElementById("composer-note");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }

  function selectDate(date, day) {
    if (day) {
      setSelectedDay(day);
      return;
    }
    setSelectedDay(null);
    setForm(freshForm(date));
    focusPrompt();
  }

  function editDay(day) {
    setForm({ id: day.id, date: day.date, score: day.score, note: day.note, visibility: day.visibility });
    setSelectedDay(null);
    focusPrompt();
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    const payload = { date: form.date, score: form.score, note: form.note || "", visibility: form.visibility || "private" };
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
    <Shell active="dashboard" user={user} token={token} navigate={navigate} onLogout={onLogout} onUserChange={onUserChange} weather={weather}>
      <div className="stat-row">
        <div className="stat-row-side">
          <span className="stat-pill"><b>{stats.entries}</b>logged</span>
          <span className="stat-pill"><b>{stats.average}</b>average</span>
        </div>
        <p className="eyebrow">Your Daymap · {year}</p>
        <div className="stat-row-side">
          <span className="stat-pill"><b>{stats.streak}d</b>best streak</span>
          <span className="stat-pill"><b>{stats.publicCount}</b>public</span>
        </div>
      </div>

      <div className="orbit-grid">
        <div className="orbit-column">
          <SolarActivityCard today={today} />
          <MomentumCard days={sortedByDate} />
        </div>

        <div className="hero-wrap">
          <section className="hero">
            <div className="hero-top">
              <h1>{today ? `Today is a ${today.score}/10` : "How was today?"}</h1>
              <p>{today?.note ? truncateNote(today.note) : "Pick a day on the map, or write below to log today."}</p>
            </div>
            <div className="heat-card">
              <YearHeatmap days={days} year={year} onSelectDate={selectDate} />
            </div>
          </section>
          <button className="notch-button" onClick={focusPrompt} title="Jump to composer" aria-label="Jump to composer">
            <Pencil size={18} />
          </button>
        </div>

        <div className="orbit-column">
          <ViewCard days={sortedByDate} />
          <MineralRatioCard days={days} onExport={() => downloadCsv(days)} />
        </div>
      </div>

      <DayComposer form={form} setForm={setForm} onSave={save} onDelete={form.id ? remove : null} error={error} streak={stats.streak} entries={stats.entries} />

      <div className="search-row">
        <SearchBar value={query} onChange={setQuery} placeholder="Search notes or dates" />
        <EntryStack entries={filtered} onSelect={setSelectedDay} empty={query ? "No entries match your search." : "Your saved entries will appear here."} />
        <InspireCard users={publicUsers} onOpen={() => navigate("explore")} />
      </div>

      <section className="lower" id="lower">
        <Trends days={days} />
        <RecentEntries days={filtered} onSelect={setSelectedDay} />
      </section>

      <DayModal day={selectedDay} days={days} onClose={() => setSelectedDay(null)} onEdit={editDay} onSelectDay={setSelectedDay} />
    </Shell>
  );
}
