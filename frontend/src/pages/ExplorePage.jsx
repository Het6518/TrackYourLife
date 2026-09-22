import { useEffect, useMemo, useState } from "react";
import Avatar from "../components/Avatar";
import PublicUserCard from "../components/PublicUserCard";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import { daysApi } from "../api/client";

export default function ExplorePage({ navigate, ...shell }) {
  const [profiles, setProfiles] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const users = await daysApi.publicUsers();
      const withDays = await Promise.all(users.map(async (user) => ({ user, data: await daysApi.publicUserDays(user.username) })));
      setProfiles(withDays.map(({ user, data }) => ({ user, days: data.days })).sort((a, b) => b.days.length - a.days.length));
    }
    load().catch((err) => setError(err.message));
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? profiles.filter((profile) => profile.user.username.toLowerCase().includes(term)) : profiles;
  }, [profiles, query]);

  const open = (username) => navigate("profile", username);

  return (
    <Shell active="explore" navigate={navigate} {...shell}>
      <div className="stage-grid">
        <section className="hero explore-hero">
          <div className="hero-top">
            <p className="eyebrow">Explore</p>
            <h1>Public Daymaps</h1>
            <p>Browse people who chose to share parts of their year.</p>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="explore-grid">
            {visible.map((profile) => (
              <PublicUserCard key={profile.user.id} user={profile.user} days={profile.days} onOpen={open} />
            ))}
          </div>
          {!visible.length && !error && <div className="stack-empty">{query ? "Nobody matches that name." : "No public Daymaps yet."}</div>}
        </section>

        <div className="side">
          <SearchBar value={query} onChange={setQuery} placeholder="Search people" />
          <section className="white-card most-active">
            <h3>Most active</h3>
            {profiles.slice(0, 5).map((profile) => (
              <button key={profile.user.id} onClick={() => open(profile.user.username)}>
                <Avatar user={profile.user} className="dark" />
                <span>{profile.user.username}</span>
                <b>{profile.days.length}</b>
              </button>
            ))}
            {!profiles.length && <p className="empty-state">Nothing here yet.</p>}
          </section>
        </div>
      </div>
    </Shell>
  );
}
