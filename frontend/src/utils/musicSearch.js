// Song search backed by Apple's iTunes Search API — public, free, no API
// key, and CORS-enabled for direct browser calls. Returns 30-second preview
// clips, which is exactly what a "pick a song to listen to" picker needs.
const SEARCH_URL = "https://itunes.apple.com/search";

export async function searchSongs(query) {
  const term = query.trim();
  if (!term) return [];

  const url = `${SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=12`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Song search failed.");
  const data = await response.json();

  return (data.results || [])
    .filter((track) => track.previewUrl)
    .map((track) => ({
      id: `itunes-${track.trackId}`,
      title: track.trackName,
      artist: track.artistName,
      audio_url: track.previewUrl,
      // swap the default 100x100 artwork for a sharper 300x300 crop
      cover_url: track.artworkUrl100?.replace("100x100", "300x300"),
      preview: true,
    }));
}
