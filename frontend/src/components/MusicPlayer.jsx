import { useEffect, useRef, useState } from "react";
import { ChevronUp, ListMusic, Pause, Play, Plus, Search, SkipBack, SkipForward, Trash2, Upload, X } from "lucide-react";
import { musicApi } from "../api/client";
import { hasYouTubeKey, loadYouTubeIframeApi, searchYouTube } from "../utils/youtube";

// A song player with two independent sources:
//  - your own uploaded library, played through a plain <audio> element
//  - a live YouTube search, played through the real YouTube IFrame Player
//    API — this is what makes actual mainstream songs possible at all,
//    since every keyless public audio API is legally limited to 30-second
//    previews or an indie/Creative-Commons catalog. See utils/youtube.js
//    for the (free, one-time) API key setup this needs.
// Mounted once, globally, in main.jsx — same pattern as WeatherFX — so
// playback survives page navigation. The YouTube player's DOM node stays
// mounted permanently (not tied to the panel being open) so switching pages
// or collapsing the widget doesn't interrupt playback or force a reload.
export default function MusicPlayer({ token }) {
  const [songs, setSongs] = useState([]);
  const [index, setIndex] = useState(-1);
  const [ytTrack, setYtTrack] = useState(null); // the currently loaded YouTube result, if any
  const [ytReady, setYtReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [panelTab, setPanelTab] = useState("library"); // "library" | "search"
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ title: "", artist: "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const fileRef = useRef(null);
  const ytContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    musicApi.list(token).then(setSongs).catch(() => setSongs([]));
  }, [token]);

  // Build the YouTube player exactly once and keep it forever — tearing it
  // down and recreating it on every play would reload the iframe each time.
  useEffect(() => {
    if (!hasYouTubeKey()) return;
    let cancelled = false;
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !ytContainerRef.current || ytPlayerRef.current) return;
      ytPlayerRef.current = new YT.Player(ytContainerRef.current, {
        // a too-small rendered size (it was 56x56, styled down to 34x34
        // via CSS) is a known trigger for YouTube/Chrome to auto-pause
        // playback a couple seconds in — real dimensions fixed that.
        height: "160",
        width: "284",
        playerVars: { rel: 0, playsinline: 1 },
        events: {
          onReady: (event) => {
            // The IFrame API can inherit a muted / 0%-volume state from
            // this browser's own stored YouTube preferences (e.g. if
            // you've ever muted a YouTube tab before) — force it audible
            // from the start so a fresh player never silently opens muted.
            event.target.unMute();
            event.target.setVolume(100);
            setYtReady(true);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              setPlaying(true);
              setError("");
            } else if (event.data === YT.PlayerState.PAUSED) setPlaying(false);
            else if (event.data === YT.PlayerState.ENDED) setPlaying(false);
          },
          // The network calls (qoe/log_event stats) fire regardless of
          // whether playback actually succeeds, so they're not proof of
          // anything by themselves — this is the only signal that tells us
          // a video genuinely failed instead of silently doing nothing.
          // Codes: 2 bad param, 5 HTML5 player error, 100 not found,
          // 101/150 the video's owner disabled embedding (very common for
          // major-label official music videos).
          onError: (event) => {
            setPlaying(false);
            const messages = {
              2: "That link was invalid.",
              5: "This video can't be played in an embedded player.",
              100: "That video isn't available anymore.",
              101: "This song's owner has disabled playback outside YouTube — try a different result (e.g. a lyric video or cover instead of the official one).",
              150: "This song's owner has disabled playback outside YouTube — try a different result (e.g. a lyric video or cover instead of the official one).",
            };
            setError(messages[event.data] || "Couldn't play that video — try another result.");
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchYouTube(term)
        .then((tracks) => {
          setResults(tracks);
          setError("");
        })
        .catch((err) => {
          setResults([]);
          setError(err.message);
        })
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const current = ytTrack || (index >= 0 ? songs[index] : null);

  useEffect(() => {
    if (ytTrack || !audioRef.current) return;
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
    else audioRef.current.pause();
  }, [playing, index, ytTrack]);

  function stopYoutube() {
    ytPlayerRef.current?.stopVideo?.();
    setYtTrack(null);
  }

  function playAt(i) {
    stopYoutube();
    setIndex(i);
    setPlaying(true);
  }

  function playYoutube(track) {
    if (!ytReady || !ytPlayerRef.current) return;
    setError("");
    setIndex(-1);
    setYtTrack(track);
    ytPlayerRef.current.loadVideoById(track.videoId);
    ytPlayerRef.current.unMute();
    ytPlayerRef.current.setVolume(100);
    setPlaying(true);
  }

  function togglePlay() {
    if (ytTrack) {
      if (playing) ytPlayerRef.current?.pauseVideo();
      else ytPlayerRef.current?.playVideo();
      return;
    }
    if (!current && songs.length) return playAt(0);
    setPlaying((p) => !p);
  }

  function next() {
    if (ytTrack || !songs.length) return;
    playAt((index + 1) % songs.length);
  }

  function prev() {
    if (ytTrack || !songs.length) return;
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
      {!ytTrack && current && (
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
            <div className="music-tabs">
              <button type="button" className={panelTab === "library" ? "active" : ""} onClick={() => setPanelTab("library")}>Your library</button>
              <button type="button" className={panelTab === "search" ? "active" : ""} onClick={() => setPanelTab("search")}>Find a song</button>
            </div>
            <div className="music-panel-actions">
              {panelTab === "library" && (
                <button type="button" className="topbar-icon" onClick={() => setUploadOpen((v) => !v)} title="Upload a song" aria-label="Upload a song"><Plus size={15} /></button>
              )}
              <button type="button" className="topbar-icon" onClick={() => setExpanded(false)} title="Close" aria-label="Close"><X size={15} /></button>
            </div>
          </div>

          {panelTab === "library" ? (
            <>
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
                {songs.map((song, i) => {
                  const isThisPlaying = i === index && !ytTrack;
                  const playThis = () => (isThisPlaying ? togglePlay() : playAt(i));
                  return (
                    <div
                      key={song.id}
                      className={`music-row ${isThisPlaying ? "active" : ""}`}
                      onClick={playThis}
                      role="button"
                      tabIndex={0}
                    >
                      <button type="button" className="music-row-play" onClick={(event) => { event.stopPropagation(); playThis(); }}>
                        {isThisPlaying && playing ? <Pause size={13} /> : <Play size={13} />}
                      </button>
                      <span className="music-row-info">
                        <strong>{song.title}</strong>
                        {song.artist && <small>{song.artist}</small>}
                      </span>
                      <button type="button" className="music-row-remove" onClick={(event) => { event.stopPropagation(); remove(song, i); }} aria-label="Remove song"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
                {!songs.length && <p className="empty-state">No songs yet — upload one, or find a real song in the "Find a song" tab.</p>}
              </div>
            </>
          ) : (
            <>
              {!hasYouTubeKey() ? (
                <p className="empty-state">
                  Song search needs a free YouTube API key. Add <code>VITE_YOUTUBE_API_KEY</code> to the frontend's <code>.env</code> — see the setup steps at the top of <code>utils/youtube.js</code>.
                </p>
              ) : (
                <>
                  <div className="music-search-bar">
                    <Search size={15} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any song or artist" />
                  </div>
                  <div className="music-list">
                    {results.map((track) => {
                      const isCurrent = ytTrack?.id === track.id;
                      const playThis = () => (isCurrent ? togglePlay() : playYoutube(track));
                      return (
                        <div
                          key={track.id}
                          className={`music-row ${isCurrent ? "active" : ""} ${ytReady ? "" : "disabled"}`}
                          onClick={ytReady ? playThis : undefined}
                          role="button"
                          tabIndex={0}
                        >
                          <button type="button" className="music-row-play" onClick={(event) => { event.stopPropagation(); playThis(); }} disabled={!ytReady}>
                            {isCurrent && playing ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                          {track.cover_url && <img className="music-row-art" src={track.cover_url} alt="" />}
                          <span className="music-row-info">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                        </div>
                      );
                    })}
                    {searching && <p className="empty-state">Searching…</p>}
                    {!searching && query.trim().length >= 2 && !results.length && !error && <p className="empty-state">No matches — try another search.</p>}
                    {error && <p className="error">{error}</p>}
                    {query.trim().length < 2 && !error && <p className="empty-state">Type a song or artist — full tracks play right here, powered by YouTube.</p>}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* the real YouTube player — kept mounted permanently (never
          conditionally rendered) so expanding/collapsing the panel or
          navigating pages never interrupts it or forces a reload. Given
          real, visible dimensions rather than shrunk down small — a
          too-small rendered size is a known trigger for YouTube/Chrome to
          auto-pause playback a couple seconds in. */}
      <div className={`music-yt-preview ${ytTrack ? "" : "hidden"}`}>
        <div ref={ytContainerRef} />
      </div>

      <div className="music-bar">
        <button type="button" className="music-bar-toggle" onClick={() => setExpanded((v) => !v)} title="Your library" aria-label="Toggle music library">
          {expanded ? <ChevronUp size={16} /> : <ListMusic size={16} />}
        </button>
        {current?.cover_url && <img className="music-bar-art" src={current.cover_url} alt="" />}
        <div className="music-bar-info" onClick={() => setExpanded(true)}>
          <strong>{current ? current.title : "No song playing"}</strong>
          <small>{current?.artist || (songs.length ? "Tap to browse your library" : "Find a song to get started")}</small>
        </div>
        <div className="music-bar-controls">
          <button type="button" onClick={prev} disabled={!songs.length || !!ytTrack} aria-label="Previous"><SkipBack size={15} /></button>
          <button type="button" className="music-bar-play" onClick={togglePlay} disabled={!current && !songs.length} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={next} disabled={!songs.length || !!ytTrack} aria-label="Next"><SkipForward size={15} /></button>
        </div>
      </div>
    </div>
  );
}
