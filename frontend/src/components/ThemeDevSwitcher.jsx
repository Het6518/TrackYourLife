import { THEMES } from "../utils/weather";

// TESTING ONLY: lets you force any weather theme without waiting on real
// geolocation/weather data, so every background + accent palette can be
// eyeballed on demand. Remove this component (and its import in main.jsx)
// once the weather theming is verified — it isn't meant to ship.
export default function ThemeDevSwitcher({ current, onSelect }) {
  return (
    <div className="theme-dev-switcher">
      <span>Preview weather</span>
      <select
        value={current?.key || ""}
        onChange={(event) => {
          const theme = Object.values(THEMES).find((t) => t.key === event.target.value);
          if (theme) onSelect(theme);
        }}
      >
        {Object.values(THEMES).map((theme) => (
          <option key={theme.key} value={theme.key}>{theme.label}</option>
        ))}
      </select>
    </div>
  );
}
