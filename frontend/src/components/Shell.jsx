import { useRef, useState } from "react";
import { Camera, Frame, Heart, Home, Image as ImageIcon, LogOut, Settings, Trash2 } from "lucide-react";
import { authApi } from "../api/client";
import Avatar from "./Avatar";
import StarMark from "./StarMark";

export default function Shell({ active, user, token, navigate, onLogout, onUserChange, children }) {
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

  function goTrends() {
    if (active === "dashboard") document.getElementById("lower")?.scrollIntoView({ behavior: "smooth" });
    else navigate("dashboard");
  }

  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home, onClick: () => navigate("dashboard") },
    { key: "explore", label: "Explore public Daymaps", icon: Heart, onClick: () => navigate("explore") },
    { key: "me", label: "My public profile", icon: ImageIcon, onClick: () => navigate("profile", user.username) },
    { key: "trends", label: "Trends", icon: Frame, onClick: goTrends },
  ];

  return (
    <div className="frame">
      <div className="shell">
        <div className="left">
          <div className="logo" title="TrackYourLife"><StarMark /></div>
          <aside className="rail">
            {items.map(({ key, label, icon: Icon, onClick }) => (
              <button key={key} className={`rail-button ${active === key ? "active" : ""}`} onClick={onClick} title={label} aria-label={label}>
                <Icon size={19} />
              </button>
            ))}
            <button className={`rail-button ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(!menuOpen)} title="Avatar settings" aria-label="Avatar settings">
              <Settings size={19} />
            </button>
            <div className="rail-bottom">
              <button className="rail-button" onClick={onLogout} title="Logout" aria-label="Logout"><LogOut size={19} /></button>
              <button className="avatar-button" onClick={() => setMenuOpen(!menuOpen)} title={user.username} aria-label="Avatar settings">
                <Avatar user={user} />
              </button>
            </div>
            {menuOpen && (
              <div className="avatar-menu">
                <strong>{user.username}</strong>
                <input ref={fileInput} type="file" accept="image/*" hidden onChange={upload} />
                <button onClick={() => fileInput.current.click()}><Camera size={15} /> Upload photo</button>
                {user.avatar_url && <button onClick={removeAvatar}><Trash2 size={15} /> Remove photo</button>}
                {error && <span className="avatar-error">{error}</span>}
              </div>
            )}
          </aside>
        </div>
        <main className="stage">{children}</main>
      </div>
    </div>
  );
}
