import { useRef, useState } from "react";
import { Bell, Camera, Compass, Home, LogOut, MapPin, Menu, Pin, Settings, Trash2, UserCog, Users, X } from "lucide-react";
import { authApi } from "../api/client";
import { prepareImage } from "../utils/image";
import AccountSettings from "./AccountSettings";
import Avatar from "./Avatar";
import StarMark from "./StarMark";
import ThemeSettings from "./ThemeSettings";

// Top bar layout mirrors the reference dashboard: small mark far left,
// section tabs centered, status + notification + avatar far right.
export default function Shell({ active, user, token, navigate, onLogout, onUserChange, onTokenChange, theme, children }) {
  const fileInput = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      // the avatar never shows bigger than ~420px, so 1024 is plenty
      const prepared = await prepareImage(file, { maxSize: 1024 });
      onUserChange(await authApi.uploadAvatar(prepared, token));
      setMenuOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
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

        <nav id="topbar-tabs" className={`topbar-tabs ${navOpen ? "open" : ""}`}>
          {tabs.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              className={`topbar-tab ${active === key ? "active" : ""}`}
              title={label}
              onClick={() => { setNavOpen(false); onClick(); }}
            >
              <Icon size={16} /> <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-right">
          {theme && theme.key !== "clear" && <span className="topbar-status">{theme.label}</span>}
          <ThemeSettings user={user} token={token} onUserChange={onUserChange} />
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
                <button onClick={() => fileInput.current.click()} disabled={uploading}><Camera size={15} /> {uploading ? "Uploading…" : "Upload photo"}</button>
                {user.avatar_url && <button onClick={removeAvatar}><Trash2 size={15} /> Remove photo</button>}
                <button onClick={() => { setMenuOpen(false); setSettingsOpen(true); }}><Settings size={15} /> Account settings</button>
                <button onClick={onLogout}><LogOut size={15} /> Logout</button>
                {error && <span className="avatar-error">{error}</span>}
              </div>
            )}
          </div>
          <button
            className="topbar-icon topbar-menu-toggle"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            aria-controls="topbar-tabs"
            onClick={() => setNavOpen(!navOpen)}
          >
            {navOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>

      <main className="stage">{children}</main>

      {settingsOpen && (
        <AccountSettings
          user={user}
          token={token}
          onUserChange={onUserChange}
          onTokenChange={onTokenChange}
          navigate={navigate}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
