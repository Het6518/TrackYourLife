// Picks a calligraphy style for a user's "Hello, {username}" greeting.
// Deterministic on the username, so the same person always sees the same
// handwriting — it's meant to feel like *their* signature, not a random
// font on every reload — while different users naturally land on different
// styles.
const SIGNATURE_FONTS = [
  { family: "'Great Vibes', cursive", size: 1.15, tilt: -2 },
  { family: "'Dancing Script', cursive", size: 1, tilt: 1 },
  { family: "'Sacramento', cursive", size: 1.2, tilt: -1 },
  { family: "'Alex Brush', cursive", size: 1.1, tilt: 2 },
  { family: "'Caveat', cursive", size: 1.05, tilt: -3 },
  { family: "'Pacifico', cursive", size: 0.9, tilt: 0 },
];

export function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// A cheap deterministic 0..1 generator seeded by an integer — used to give
// each letter its own (but consistent, replayable) wobble/tilt/timing, so
// the handwriting looks organic instead of every letter animating
// identically, without ever being different on a re-render.
export function seededRandom(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function signatureFor(username) {
  const hash = hashString(username || "you");
  return SIGNATURE_FONTS[hash % SIGNATURE_FONTS.length];
}
