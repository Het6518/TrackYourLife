// Real, mainstream songs via YouTube: search through the YouTube Data API
// v3 (needs a free API key — see README below) and play back through the
// official YouTube IFrame Player API. This is the only realistic free path
// to actual popular/commercial music; every keyless public API (iTunes,
// Jamendo, Deezer) is legally limited to either 30-second previews or an
// independent/Creative-Commons catalog, not real chart hits.
//
// Setup (one-time, free, no payment):
//   1. console.cloud.google.com -> create a project (or reuse one)
//   2. APIs & Services -> Library -> enable "YouTube Data API v3"
//   3. APIs & Services -> Credentials -> Create Credentials -> API key
//   4. put it in frontend/.env as VITE_YOUTUBE_API_KEY=your-key-here
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export function hasYouTubeKey() {
  return Boolean(API_KEY);
}

let apiPromise = null;

// Loads the YouTube IFrame Player API script exactly once, however many
// times this is called, and resolves with the global `YT` namespace once
// it's actually ready to construct players with.
export function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return apiPromise;
}

export async function searchYouTube(query) {
  if (!API_KEY) {
    throw new Error("Song search needs a free YouTube API key — see utils/youtube.js for setup steps.");
  }
  const term = query.trim();
  if (!term) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(term)}&key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message || "YouTube search failed.");
  }
  const data = await response.json();

  return (data.items || [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      id: `yt-${item.id.videoId}`,
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      cover_url: item.snippet.thumbnails?.default?.url,
      source: "youtube",
    }));
}
