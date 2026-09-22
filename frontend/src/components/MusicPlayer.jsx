import { useEffect, useRef, useState } from "react";
import { ChevronUp, ListMusic, Pause, Play, Plus, SkipBack, SkipForward, Trash2, Upload, X } from "lucide-react";
import { musicApi } from "../api/client";

// A personal song library: the user uploads their own tracks and browses/
// plays them from a persistent mini player that survives page navigation
// (mounted once, globally, in main.jsx — same pattern as WeatherFX).
export default function MusicPlayer({ token }) {
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "" });
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    musicApi.list(token).then(setSongs).catch(() => setSongs([]));
  }, [token]);

  const current = index >= 0 ? songs[index] : null;

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
    else audioRef.current.pause();
  }, [playing, index]);

  function playAt(i) {
    setIndex(i);
    setPlaying(true);
  }

  function togglePlay() {
    if (!current && songs.length) return playAt(0);
    setPlaying((p) => !p);
  }

  function next() {
    if (!songs.length) return;
    playAt((index + 1) % songs.length);
  }

  function prev() {
    if (!songs.length) return;
    playAt((index - 1 + songs.length) % songs.length);
  }

  async function upload(event) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !form.title.trim()) {
      setError("Give it a title and pick an audio file.");
      return;
    }
    setError("");
    try {
      const song = await musicApi.upload({ title: form.title, artist: form.artist, file }, token);
      setSongs((s) => [song, ...s]);
      setForm({ title: "", artist: "" });
      if (fileRef.current) fileRef.current.value = "";
      setUploadOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(song, i) {
    await musicApi.remove(song.id, token).catch(() => {});
    setSongs((s) => s.filter((_, idx) => idx !== i));
    if (i === index) {
      setPlaying(false);
      setIndex(-1);
    } else if (i < index) {
      setIndex((idx) => idx - 1);
    }
  }

  if (!token) return null;

  return (
    <div className={`music-widget ${expanded ? "open" : ""}`}>
      {current && (
        <audio
          ref={audioRef}
          src={current.audio_url}
          onEnded={next}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      )}

      {expanded && (
        <div className="music-panel">
          <div className="music-panel-head">
            <h3>Your library</h3>
            <div className="music-panel-actions">
              <button type="button" className="topbar-icon" onClick={() => setUploadOpen((v) => !v)} title="Upload a song" aria-label="Upload a song"><Plus size={15} /></button>
              <button type="button" className="topbar-icon" onClick={() => setExpanded(false)} title="Close" aria-label="Close"><X size={15} /></button>
            </div>
          </div>

          {uploadOpen && (
            <form className="music-upload" onSubmit={upload}>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
              <input
                placeholder="Artist (optional)"
                value={form.artist}
                onChange={(event) => setForm({ ...form, artist: event.target.value })}
              />
              <label className="music-file-picker">
                <Upload size={14} /> Choose audio file
                <input ref={fileRef} type="file" accept="audio/*" hidden />
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary small full">Add to library</button>
            </form>
          )}

          <div className="music-list">
            {songs.map((song, i) => (
              <div key={song.id} className={`music-row ${i === index ? "active" : ""}`}>
                <button type="button" className="music-row-play" onClick={() => (i === index ? togglePlay() : playAt(i))}>
                  {i === index && playing ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <span className="music-row-info">
                  <strong>{song.title}</strong>
                  {song.artist && <small>{song.artist}</small>}
                </span>
                <button type="button" className="music-row-remove" onClick={() => remove(song, i)} aria-label="Remove song"><Trash2 size={13} /></button>
              </div>
            ))}
            {!songs.length && <p className="empty-state">No songs yet — add one to soundtrack your Daymap.</p>}
          </div>
        </div>
      )}

      <div className="music-bar">
        <button type="button" className="music-bar-toggle" onClick={() => setExpanded((v) => !v)} title="Your library" aria-label="Toggle music library">
          {expanded ? <ChevronUp size={16} /> : <ListMusic size={16} />}
        </button>
        <div className="music-bar-info" onClick={() => setExpanded(true)}>
          <strong>{current ? current.title : "No song playing"}</strong>
          <small>{current?.artist || (songs.length ? "Tap to browse your library" : "Upload a song to get started")}</small>
        </div>
        <div className="music-bar-controls">
          <button type="button" onClick={prev} disabled={!songs.length} aria-label="Previous"><SkipBack size={15} /></button>
          <button type="button" className="music-bar-play" onClick={togglePlay} disabled={!songs.length} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={next} disabled={!songs.length} aria-label="Next"><SkipForward size={15} /></button>
        </div>
      </div>
    </div>
  );
}
