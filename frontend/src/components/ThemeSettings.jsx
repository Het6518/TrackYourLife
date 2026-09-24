import { useRef, useState } from "react";
import { Check, Palette, RotateCcw, Upload } from "lucide-react";
import { authApi } from "../api/client";

const ACCENT_PRESETS = ["#ff6a3d", "#5ec2ff", "#4fd1c5", "#ff8fc0", "#a3e635", "#f5c542"];

const EFFECT_OPTIONS = [
  { key: "", label: "None" },
  { key: "winter", label: "Winter" },
  { key: "summer", label: "Summer" },
  { key: "rain", label: "Rain" },
  { key: "blossom", label: "Cherry Blossom" },
];

// App-wide personalization: a background effect (winter/summer/rain/cherry
// blossom, or none), a custom background photo (overrides the effect photo
// everywhere), and/or a fixed accent color (overrides the effect-driven hue
// everywhere). All optional, all independent, all reversible. Global — lives
// in the top bar, not tied to any one page, since it affects the whole app.
export default function ThemeSettings({ user, token, onUserChange }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function uploadBackground(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onUserChange(await authApi.uploadThemeBackground(file, token));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeBackground() {
    setError("");
    try {
      await authApi.removeThemeBackground(token);
      onUserChange({ ...user, theme_background_url: null });
    } catch (err) {
      setError(err.message);
    }
  }

  async function setAccent(color) {
    setError("");
    onUserChange({ ...user, theme_accent_color: color }); // optimistic
    try {
      onUserChange(await authApi.updateThemeAccent(color, token));
    } catch (err) {
      setError(err.message);
    }
  }

  async function setEffect(effect) {
    setError("");
    onUserChange({ ...user, theme_effect: effect }); // optimistic
    try {
      onUserChange(await authApi.updateThemeEffect(effect, token));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="theme-settings-wrap">
      <button type="button" className="topbar-icon" onClick={() => setOpen((v) => !v)} title="Personalize appearance" aria-label="Personalize appearance">
        <Palette size={17} />
      </button>

      {open && (
        <div className="theme-settings-menu">
          <div className="theme-settings-section">
            <h3>Background effect</h3>
            <p className="theme-settings-hint">Pick a themed backdrop, or none for a plain look.</p>
            <div className="theme-settings-row">
              {EFFECT_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.key}
                  className={`soft-button ${(user.theme_effect || "") === option.key ? "selected" : ""}`}
                  onClick={() => setEffect(option.key)}
                >
                  {(user.theme_effect || "") === option.key && <Check size={13} />} {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="theme-settings-section">
            <h3>Background photo</h3>
            <p className="theme-settings-hint">Upload your own photo to override the effect backdrop.</p>
            <div className="theme-settings-row">
              <button type="button" className="soft-button" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload size={14} /> {user.theme_background_url ? "Replace" : "Upload"} photo
              </button>
              {user.theme_background_url && (
                <button type="button" className="soft-button" onClick={removeBackground}>
                  <RotateCcw size={14} /> None
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadBackground} />
            </div>
            {user.theme_background_url && (
              <div className="theme-settings-preview">
                <img src={user.theme_background_url} alt="Your background" />
              </div>
            )}
          </div>

          <div className="theme-settings-section">
            <h3>Accent color</h3>
            <p className="theme-settings-hint">Pick a fixed color, or stay automatic to shift with the effect.</p>
            <div className="theme-settings-swatches">
              {ACCENT_PRESETS.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={`theme-accent-swatch ${user.theme_accent_color === color ? "selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => setAccent(color)}
                  aria-label={color}
                >
                  {user.theme_accent_color === color && <Check size={13} />}
                </button>
              ))}
              <label className="theme-accent-swatch custom" title="Custom color">
                <input type="color" value={user.theme_accent_color || "#ff6a3d"} onChange={(event) => setAccent(event.target.value)} />
              </label>
              {user.theme_accent_color && (
                <button type="button" className="soft-button" onClick={() => setAccent("")}>
                  <RotateCcw size={14} /> Automatic
                </button>
              )}
            </div>
          </div>

          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}
