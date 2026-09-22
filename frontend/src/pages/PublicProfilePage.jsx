import { useEffect, useMemo, useState } from "react";
import { Check, UserMinus, UserPlus, UserX } from "lucide-react";
import Avatar from "../components/Avatar";
import DayModal from "../components/DayModal";
import EntryStack from "../components/EntryStack";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import Trends from "../components/Trends";
import YearHeatmap from "../components/YearHeatmap";
import { daysApi, friendsApi } from "../api/client";
import { averageScore, bestStreak, shortDate } from "../utils/date";

export default function PublicProfilePage({ username, navigate, ...shell }) {
  const [profile, setProfile] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [relation, setRelation] = useState(null); // {relationship, request_id}
  const year = new Date().getFullYear();
  const isSelf = username === shell.user.username;
  const active = isSelf ? "me" : "";

  useEffect(() => {
    setProfile(null);
    setError("");
    daysApi.publicUserDays(username, shell.token).then(setProfile).catch((err) => setError(err.message));
  }, [username]);

  useEffect(() => {
    if (isSelf) {
      setRelation(null);
      return;
    }
    friendsApi.search(username, shell.token)
      .then((results) => setRelation(results.find((r) => r.username === username) || { relationship: "none", request_id: null }))
      .catch(() => setRelation(null));
  }, [username, isSelf]);

  async function sendFriendRequest() {
    try {
      const result = await friendsApi.send(username, shell.token);
      setRelation({ relationship: result.status === "accepted" ? "friends" : "pending_outgoing", request_id: result.id });
    } catch (err) {
      setError(err.message);
    }
  }

  async function respond(action) {
    if (!relation?.request_id) return;
    await friendsApi[action](relation.request_id, shell.token).catch(() => {});
    setRelation(action === "accept" ? { relationship: "friends", request_id: null } : { relationship: "none", request_id: null });
  }

  async function unfriend() {
    await friendsApi.remove(username, shell.token).catch(() => {});
    setRelation({ relationship: "none", request_id: null });
  }

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
            {!isSelf && relation && (
              <div className="friend-action">
                {relation.relationship === "none" && (
                  <button type="button" className="soft-button" onClick={sendFriendRequest}><UserPlus size={15} /> Add friend</button>
                )}
                {relation.relationship === "pending_outgoing" && (
                  <button type="button" className="soft-button" disabled><UserPlus size={15} /> Request sent</button>
                )}
                {relation.relationship === "pending_incoming" && (
                  <>
                    <button type="button" className="primary small" onClick={() => respond("accept")}><Check size={15} /> Accept</button>
                    <button type="button" className="soft-button" onClick={() => respond("decline")}><UserX size={15} /> Decline</button>
                  </>
                )}
                {relation.relationship === "friends" && (
                  <button type="button" className="soft-button" onClick={unfriend}><UserMinus size={15} /> Friends · Remove</button>
                )}
              </div>
            )}
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
