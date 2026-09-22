import { ArrowUpRight } from "lucide-react";
import Avatar from "./Avatar";

export default function InspireCard({ users, onOpen }) {
  const shown = users.slice(0, 3);

  return (
    <section className="inspire-card">
      <div className="inspire-head">
        <h3>Get inspired</h3>
        <button onClick={onOpen} title="Explore public Daymaps" aria-label="Explore public Daymaps"><ArrowUpRight size={18} /></button>
      </div>
      <div className="inspire-stack">
        {shown.length ? (
          shown.map((user, index) => (
            <button key={user.id} className={`inspire-tile tile-${index}`} onClick={onOpen}>
              <Avatar user={user} className="dark" />
              <span>{user.username}</span>
            </button>
          ))
        ) : (
          <p className="inspire-empty">Nobody has shared a Daymap yet. Make an entry public to be the first.</p>
        )}
      </div>
    </section>
  );
}
