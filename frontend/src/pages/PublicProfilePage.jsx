import { useEffect, useMemo, useState } from "react";
import DayModal from "../components/DayModal";
import Trends from "../components/Trends";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi } from "../api/client";
import { averageScore, bestStreak, shortDate } from "../utils/date";

export default function PublicProfilePage({ username, navigate }) {
  const [profile, setProfile] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
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

  if (error) {
    return <main className="page-shell"><p className="error">{error}</p><button className="soft-button" onClick={() => navigate("explore")}>Back to Explore</button></main>;
  }

  if (!profile) return <main className="loading">Loading...</main>;

  return (
    <main className="page-shell public-profile">
      <header className="profile-hero">
        <div className="profile-title">
          <span className="avatar large">{profile.user.username.slice(0, 2).toUpperCase()}</span>
          <div>
            <p className="eyebrow">Public Daymap</p>
            <h1>{profile.user.username}</h1>
            <p>{year} public profile</p>
          </div>
        </div>
        <div className="nav-actions"><button onClick={() => navigate("dashboard")}>Dashboard</button><button onClick={() => navigate("explore")}>Explore</button></div>
      </header>

      <section className="profile-stats">
        <article><span>Days logged</span><strong>{stats.logged}/365</strong></article>
        <article><span>Avg rating</span><strong>{stats.average}/10</strong></article>
        <article><span>Best streak</span><strong>{stats.streak}d</strong></article>
        <article><span>Green days</span><strong>{stats.green}</strong></article>
      </section>

      <section className="glass-panel profile-heatmap">
        <div className="section-heading">
          <div><p className="eyebrow">Calendar</p><h2>{year} public heatmap</h2></div>
        </div>
        <YearHeatmap days={days} year={year} onSelectDate={(_, day) => day && setSelectedDay(day)} />
      </section>

      <Trends days={days} />

      <section className="best-worst-grid">
        <EntryRank title="Best days" days={bestDays} onSelect={setSelectedDay} />
        <EntryRank title="Hard days" days={worstDays} onSelect={setSelectedDay} />
      </section>

      <section className="glass-panel all-entries">
        <div className="section-heading"><div><p className="eyebrow">Archive</p><h2>All public entries</h2></div></div>
        {days.map((day) => (
          <button key={day.id} className="public-entry" onClick={() => setSelectedDay(day)}>
            <span className={`dot level-${day.score}`} />
            <span><strong>{shortDate(day.date)}</strong><small>{day.note || "No note"}</small></span>
            <b>{day.score}/10</b>
          </button>
        ))}
      </section>

      <DayModal day={selectedDay} days={days} onClose={() => setSelectedDay(null)} onSelectDay={setSelectedDay} />
    </main>
  );
}

function EntryRank({ title, days, onSelect }) {
  return (
    <section className="glass-panel rank-list">
      <p className="eyebrow">{title}</p>
      {days.map((day) => (
        <button key={day.id} onClick={() => onSelect(day)}>
          <span><strong>{shortDate(day.date)}</strong><small>{day.note || "No note"}</small></span>
          <b className={`score-text level-text-${day.score}`}>{day.score}/10</b>
        </button>
      ))}
    </section>
  );
}
