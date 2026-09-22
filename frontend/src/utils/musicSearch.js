// Song search backed by Jamendo Music API — free, public client ID,
// and CORS-enabled for direct browser calls. Returns full-length streaming tracks.
const CLIENT_ID = "1f8197e6";
const SEARCH_URL = "https://api.jamendo.com/v3.0/tracks/";


export async function searchSongs(query) {
  const term = query.trim();
  if (!term) return [];

  const url = `${SEARCH_URL}?client_id=${CLIENT_ID}&format=json&namesearch=${encodeURIComponent(term)}&limit=12`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Song search failed.");
  const data = await response.json();

  return (data.results || [])
    .filter((track) => track.audio)
    .map((track) => ({
      id: `jamendo-${track.id}`,
      title: track.name,
      artist: track.artist_name,
      audio_url: track.audio,
      cover_url: track.album_image || track.image,
      preview: false,
    }));
}
