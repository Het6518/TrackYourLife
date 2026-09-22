// Detects the user's real-world weather/season and maps it to a visual theme.
// Uses the free, keyless Open-Meteo API + browser geolocation. Falls back to
// a month-based season guess (and finally a static theme) if either is denied
// or unavailable, so the UI is always themed.

const THEMES = {
  winter: { key: "winter", label: "Winter", image: "/weather/winter.jpg" },
  summer: { key: "summer", label: "Summer", image: "/weather/summer.jpg" },
  monsoon: { key: "monsoon", label: "Monsoon", image: "/weather/monsoon.jpg" },
  spring: { key: "spring", label: "Spring", image: "/weather/spring.jpg" },
  blossom: { key: "blossom", label: "Cherry Blossom", image: "/weather/cherry-blossom.jpg" },
};

// WMO weather codes -> rain/storm codes count as "monsoon"
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function seasonFromMonth(month, isNorthern = true) {
  // month: 0-11
  const m = isNorthern ? month : (month + 6) % 12;
  if (m === 2 && Math.random() < 0.3) return THEMES.blossom; // a little seasonal flavor
  if (m >= 2 && m <= 3) return THEMES.spring; // Mar-Apr
  if (m >= 4 && m <= 5) return THEMES.summer; // May-Jun
  if (m >= 6 && m <= 8) return THEMES.monsoon; // Jul-Sep
  if (m >= 9 && m <= 10) return THEMES.spring; // Oct-Nov (autumn, reuse spring palette)
  return THEMES.winter; // Dec-Feb
}

function themeFromWeatherCode(code, temperatureC, month) {
  if (SNOW_CODES.has(code) || temperatureC <= 5) return THEMES.winter;
  if (RAIN_CODES.has(code)) return THEMES.monsoon;
  if (temperatureC >= 30) return THEMES.summer;
  if (month === 2 || month === 3) return THEMES.blossom;
  return THEMES.spring;
}

function getPosition(timeout = 6000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { timeout, maximumAge: 1000 * 60 * 30 }
    );
  });
}

function fetchWithTimeout(url, ms = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function detectWeatherTheme() {
  const month = new Date().getMonth();
  try {
    const { latitude, longitude } = await getPosition();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error("weather request failed");
    const data = await res.json();
    const code = data?.current?.weather_code;
    const temp = data?.current?.temperature_2m;
    const isNorthern = latitude >= 0;
    if (typeof code === "number" && typeof temp === "number") {
      return { ...themeFromWeatherCode(code, temp, month), source: "live", temperature: temp };
    }
    return { ...seasonFromMonth(month, isNorthern), source: "season" };
  } catch {
    return { ...seasonFromMonth(month, true), source: "fallback" };
  }
}

// Synchronous first guess (by month) so the background paints immediately,
// before the async geolocation/weather lookup has a chance to resolve.
export function instantThemeGuess() {
  return { ...seasonFromMonth(new Date().getMonth(), true), source: "instant" };
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme.key;
  root.style.setProperty("--bg-image", `url(${theme.image})`);
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
// accent color) on top of whatever the automatic weather theme set — always
// called again whenever the weather theme changes, so personalization keeps
// winning instead of being clobbered by the next weather update. Passing no
// user, or a user with neither field set, is a no-op / clears any override.
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

export { THEMES };
