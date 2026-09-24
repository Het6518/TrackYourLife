// Applies the user's chosen background effect (or none) as a visual theme:
// a data-theme attribute (drives the accent hue), a background photo, and a
// particle effect mode for WeatherFX. Entirely user-picked — see
// components/ThemeSettings.jsx — there is no automatic weather/season
// detection.

const EFFECTS = {
  "": { key: "clear", label: "None", image: null, fx: null },
  winter: { key: "winter", label: "Winter", image: "/weather/winter.jpg", fx: "snow" },
  summer: { key: "summer", label: "Summer", image: "/weather/summer.jpg", fx: "sun" },
  rain: { key: "monsoon", label: "Rain", image: "/weather/monsoon.jpg", fx: "rain" },
  blossom: { key: "blossom", label: "Cherry Blossom", image: "/weather/cherry-blossom.jpg", fx: "petal" },
};

export function effectTheme(effect) {
  return EFFECTS[effect || ""] || EFFECTS[""];
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.key;
  root.style.setProperty("--bg-image", theme.image ? `url(${theme.image})` : "none");
}

// Blends a #rrggbb color toward white — used to derive the lighter
// "--orange-2" tint from a single accent color the user picks.
function lighten(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const channel = (shift) => {
    const value = (num >> shift) & 255;
    return Math.round(value + (255 - value) * amount);
  };
  return `#${[channel(16), channel(8), channel(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Applies a user's personal overrides (custom background photo and/or
// accent color) on top of whatever the chosen effect theme set — always
// called again whenever the effect theme changes, so personalization keeps
// winning instead of being clobbered. Passing no user, or a user with
// neither field set, is a no-op / clears any override.
export function applyPersonalization(user) {
  const root = document.documentElement;

  if (user?.theme_background_url) {
    root.style.setProperty("--bg-image", `url(${user.theme_background_url})`);
  }

  if (user?.theme_accent_color) {
    root.style.setProperty("--orange", user.theme_accent_color);
    root.style.setProperty("--orange-2", lighten(user.theme_accent_color, 0.35));
  } else {
    root.style.removeProperty("--orange");
    root.style.removeProperty("--orange-2");
  }
}

export { EFFECTS };
