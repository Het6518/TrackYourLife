import { useRef, useState } from "react";
import { Bell, Camera, Compass, Home, LogOut, MapPin, Pin, Trash2, UserCog, Users } from "lucide-react";
import { authApi } from "../api/client";
import Avatar from "./Avatar";
import StarMark from "./StarMark";

// Top bar layout mirrors the reference dashboard: small mark far left,
// section tabs centered, status + notification + avatar far right.
export default function Shell({ active, user, token, navigate, onLogout, onUserChange, weather, children }) {
  const fileInput = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      onUserChange(await authApi.uploadAvatar(file, token));
      setMenuOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAvatar() {
    setError("");
    try {
      await authApi.removeAvatar(token);
      onUserChange({ ...user, avatar_url: null });
      setMenuOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  const tabs = [
    { key: "dashboard", label: "Overview", icon: Home, onClick: () => navigate("dashboard") },
    { key: "explore", label: "Explore", icon: Compass, onClick: () => navigate("explore") },
    { key: "map", label: "Map", icon: MapPin, onClick: () => navigate("map") },
    { key: "board", label: "Vision Board", icon: Pin, onClick: () => navigate("board") },
    { key: "friends", label: "Friends", icon: Users, onClick: () => navigate("friends") },
    { key: "me", label: "My profile", icon: UserCog, onClick: () => navigate("profile", user.username) },
  ];

  return (
    <div className="frame">
      <header className="topbar">
        <div className="topbar-mark" title="TrackYourLife">
          <span className="logo"><StarMark /></span>
          <b>TrackYourLife</b>
        </div>

        <nav className="topbar-tabs">
          {tabs.map(({ key, label, icon: Icon, onClick }) => (
            <button key={key} className={`topbar-tab ${active === key ? "active" : ""}`} onClick={onClick}>
              <Icon size={16} /> <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          {weather && <span className="topbar-status">{weather.label}{typeof weather.temperature === "number" ? ` · ${Math.round(weather.temperature)}°C` : ""}</span>}
          <button className="topbar-icon" title="Explore public Daymaps" aria-label="Explore public Daymaps" onClick={() => navigate("explore")}>
            <Bell size={17} />
          </button>
          <div className="avatar-wrap">
            <button className="avatar-button" onClick={() => setMenuOpen(!menuOpen)} title={user.username} aria-label="Account menu">
              <Avatar user={user} />
            </button>
            {menuOpen && (
              <div className="avatar-menu">
                <strong>{user.username}</strong>
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={upload} />
                <button onClick={() => fileInput.current.click()}><Camera size={15} /> Upload photo</button>
                {user.avatar_url && <button onClick={removeAvatar}><Trash2 size={15} /> Remove photo</button>}
                <button onClick={onLogout}><LogOut size={15} /> Logout</button>
                {error && <span className="avatar-error">{error}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="stage">{children}</main>
    </div>
  );
}
