import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import PublicUserCard from "../components/PublicUserCard";
import { daysApi } from "../api/client";

export default function ExplorePage({ navigate }) {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const users = await daysApi.publicUsers();
      const withDays = await Promise.all(users.map(async (user) => ({ user, data: await daysApi.publicUserDays(user.username) })));
      setProfiles(withDays.map(({ user, data }) => ({ user, days: data.days })).sort((a, b) => b.days.length - a.days.length));
    }
    load().catch((err) => setError(err.message));
  }, []);

  return (
    <main className="page-shell explore-page">
      <header className="simple-topbar">
        <div>
          <span className="brand-mark"><Compass size={18} /> Explore</span>
          <h1>Public Daymaps</h1>
          <p>Browse people who chose to share parts of their year.</p>
        </div>
        <button className="soft-button" onClick={() => navigate("dashboard")}>Dashboard</button>
      </header>
      {error && <p className="error">{error}</p>}
      <section className="explore-grid">
        {profiles.map((profile) => (
          <PublicUserCard key={profile.user.id} user={profile.user} days={profile.days} onOpen={(username) => navigate("profile", username)} />
        ))}
      </section>
      {!profiles.length && !error && <div className="empty-large">No public Daymaps yet.</div>}
    </main>
  );
}
