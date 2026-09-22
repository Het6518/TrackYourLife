import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import DayModal from "../components/DayModal";
import EntryStack from "../components/EntryStack";
import InspireCard from "../components/InspireCard";
import PromptBar from "../components/PromptBar";
import RecentEntries from "../components/RecentEntries";
import ScoreCard from "../components/ScoreCard";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import Trends from "../components/Trends";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi } from "../api/client";
import { averageScore, bestStreak, dayToIso, todayIso } from "../utils/date";
import { downloadCsv } from "../utils/export";

const freshForm = (date = todayIso()) => ({ date, score: 7, note: "", is_public: false });

export default function DashboardPage({ token, user, onLogout, onUserChange, navigate }) {
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
    publicCount: days.filter((day) => day.is_public).length,
  }), [days]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return days;
    return days.filter((day) => day.note.toLowerCase().includes(term) || day.date.includes(term));
  }, [days, query]);

  const week = useMemo(() => {
    const logged = new Set(days.map((day) => day.date));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return logged.has(dayToIso(date));
    });
  }, [days]);

  async function loadDays() {
    setDays(await daysApi.list(token));
  }

  useEffect(() => {
    loadDays().catch((err) => setError(err.message));
    daysApi.publicUsers().then(setPublicUsers).catch(() => setPublicUsers([]));
  }, []);

  function focusPrompt() {
    document.getElementById("prompt-input")?.focus();
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
    setForm({ id: day.id, date: day.date, score: day.score, note: day.note, is_public: day.is_public });
    setSelectedDay(null);
    focusPrompt();
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
    <Shell active="dashboard" user={user} token={token} navigate={navigate} onLogout={onLogout} onUserChange={onUserChange}>
      <div className="stage-grid">
        <div className="hero-wrap">
          <section className="hero">
            <div className="hero-top">
              <p className="eyebrow">Your Daymap · {year}</p>
              <h1>{today ? `Today is a ${today.score}/10` : "How was today?"}</h1>
              <p>{today?.note || "Pick a day on the map, or write a note below to log today."}</p>
              <div className="stat-chips">
                <span><b>{stats.entries}</b> logged</span>
                <span><b>{stats.average}</b> average</span>
                <span><b>{stats.streak}d</b> best streak</span>
                <span><b>{stats.publicCount}</b> public</span>
              </div>
            </div>
            <div className="heat-card">
              <YearHeatmap days={days} year={year} onSelectDate={selectDate} />
            </div>
            <PromptBar form={form} setForm={setForm} onSave={save} onDelete={remove} error={error} />
          </section>
          <button className="notch-button" onClick={() => downloadCsv(days)} title="Download your entries (CSV)" aria-label="Download your entries as CSV">
            <Download size={20} />
          </button>
          <ScoreCard form={form} setForm={setForm} week={week} />
        </div>

        <div className="side">
          <SearchBar value={query} onChange={setQuery} placeholder="Search notes or dates" />
          <EntryStack entries={filtered} onSelect={setSelectedDay} empty={query ? "No entries match your search." : "Your saved entries will appear here."} />
          <InspireCard users={publicUsers} onOpen={() => navigate("explore")} />
        </div>
      </div>

      <section className="lower" id="lower">
        <Trends days={days} />
        <RecentEntries days={filtered} onSelect={setSelectedDay} />
      </section>

      <DayModal day={selectedDay} days={days} onClose={() => setSelectedDay(null)} onEdit={editDay} onSelectDay={setSelectedDay} />
    </Shell>
  );
}
