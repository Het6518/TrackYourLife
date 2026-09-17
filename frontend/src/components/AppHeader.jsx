import { LogOut, Search } from "lucide-react";

export default function AppHeader({ user, isPublic, onExplore, onDashboard, onLogout }) {
  const initials = user?.username?.slice(0, 2).toUpperCase() || "TY";

  return (
    <header className="app-header">
      <div className="identity">
        <div className="avatar">{initials}</div>
        <strong>{user?.username || "TrackYourLife"}</strong>
        {isPublic !== undefined && <span className="pill">{isPublic ? "Public" : "Private"}</span>}
      </div>
      <nav className="nav-actions">
        {onDashboard && <button onClick={onDashboard}>Dashboard</button>}
        {onExplore && (
          <button onClick={onExplore}>
            <Search size={15} />
            Explore
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} title="Logout">
            <LogOut size={15} />
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
