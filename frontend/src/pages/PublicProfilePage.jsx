import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import DayModal from "../components/DayModal";
import EntryStack from "../components/EntryStack";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import Trends from "../components/Trends";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi } from "../api/client";
import { averageScore, bestStreak, shortDate } from "../utils/date";

export default function PublicProfilePage({ username, navigate, ...shell }) {
  const [profile, setProfile] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const year = new Date().getFullYear();
  const active = username === shell.user.username ? "me" : "";

  useEffect(() => {
    setProfile(null);
    setError("");
    daysApi.publicUserDays(username).then(setProfile).catch((err) => setError(err.message));
  }, [username]);

  const days = profile?.days || [];
  const stats = useMemo(() => ({
    logged: days.length,
    average: averageScore(days),
    streak: bestStreak(days),
    green: days.filter((day) => day.score >= 7).length,
  }), [days]);
  const bestDays = [...days].sort((a, b) => b.score - a.score).slice(0, 3);
  const worstDays = [...days].sort((a, b) => a.score - b.score).slice(0, 3);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? days.filter((day) => day.note.toLowerCase().includes(term) || day.date.includes(term)) : days;
  }, [days, query]);

  if (error) {
    return (
      <Shell active={active} navigate={navigate} {...shell}>
        <section className="hero"><p className="error">{error}</p><button className="soft-button" onClick={() => navigate("explore")}>Back to Explore</button></section>
      </Shell>
    );
  }

  if (!profile) return <main className="loading">Loading...</main>;

  return (
    <Shell active={active} navigate={navigate} {...shell}>
      <div className="stage-grid">
        <section className="hero">
          <div className="hero-top profile-title">
            <Avatar user={profile.user} className="large" />
            <div>
              <p className="eyebrow">Public Daymap · {year}</p>
              <h1>{profile.user.username}</h1>
            </div>
          </div>
          <div className="stat-chips">
            <span><b>{stats.logged}/365</b> days logged</span>
            <span><b>{stats.average}/10</b> avg rating</span>
            <span><b>{stats.streak}d</b> best streak</span>
            <span><b>{stats.green}</b> green days</span>
          </div>
          <div className="heat-card">
            <YearHeatmap days={days} year={year} onSelectDate={(_, day) => day && setSelectedDay(day)} />
          </div>
        </section>

        <div className="side">
          <SearchBar value={query} onChange={setQuery} placeholder="Search entries" />
          <EntryStack entries={bestDays} onSelect={setSelectedDay} empty="No public entries yet." />
          <section className="white-card rank-list">
            <h3>Hard days</h3>
            {worstDays.map((day) => (
              <button key={day.id} onClick={() => setSelectedDay(day)}>
                <span><strong>{shortDate(day.date)}</strong><small>{day.note || "No note"}</small></span>
                <b>{day.score}/10</b>
              </button>
            ))}
            {!worstDays.length && <p className="empty-state">Nothing to show.</p>}
          </section>
        </div>
      </div>

      <section className="lower">
        <Trends days={days} />
        <section className="panel all-entries">
          <h2>All public entries</h2>
          {filtered.map((day) => (
            <button key={day.id} className="public-entry" onClick={() => setSelectedDay(day)}>
              <span className={`dot level-${day.score}`} />
              <span><strong>{shortDate(day.date)}</strong><small>{day.note || "No note"}</small></span>
              <b>{day.score}/10</b>
            </button>
          ))}
          {!filtered.length && <p className="empty-state">No matching entries.</p>}
        </section>
      </section>

      <DayModal day={selectedDay} days={days} onClose={() => setSelectedDay(null)} onSelectDay={setSelectedDay} />
    </Shell>
  );
}
