import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopology from "../assets/world-110m.json";
import Avatar from "../components/Avatar";
import Shell from "../components/Shell";
import { daysApi } from "../api/client";

// Fully offline world map: real country outlines from a bundled TopoJSON
// (Natural Earth 110m, ships with the app — no tile server, no API key, no
// runtime network call at all) rendered with d3-geo, then avatars are
// dropped on top by projecting each user's lat/lng to the same SVG space.
const WIDTH = 960;
const HEIGHT = 500;
const countries = feature(worldTopology, worldTopology.objects.countries).features;
const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
const pathGenerator = geoPath(projection);
const countryPaths = countries.map((c) => ({ id: c.id, d: pathGenerator(c) }));
const graticule = pathGenerator({ type: "Sphere" });

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function MapPage({ navigate, user, ...shell }) {
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    daysApi.publicUsers().then(setProfiles).catch((err) => setError(err.message));
  }, []);

  const pinned = useMemo(() => {
    const withLocation = profiles.filter((p) => p.location && p.username !== user?.username);
    const self = user?.location ? [{ ...user, __self: true }] : [];
    return [...self, ...withLocation]
      .map((p) => {
        const point = projection([p.location.lng, p.location.lat]);
        return point ? { ...p, x: point[0], y: point[1] } : null;
      })
      .filter(Boolean);
  }, [profiles, user]);

  function onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({ ...v, k: clamp(v.k * delta, 1, 8) }));
  }

  function onPointerDown(event) {
    dragRef.current = { startX: event.clientX, startY: event.clientY, origin: view };
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragRef.current) return;
    const { startX, startY, origin } = dragRef.current;
    setView({ ...origin, x: origin.x + (event.clientX - startX), y: origin.y + (event.clientY - startY) });
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function resetView() {
    setView({ x: 0, y: 0, k: 1 });
  }

  return (
    <Shell active="map" navigate={navigate} user={user} {...shell}>
      <div className="map-page">
        <div className="stat-row">
          <div className="stat-row-side">
            <span className="stat-pill"><b>{pinned.length}</b>on the map</span>
          </div>
          <p className="eyebrow">Where Daymaps are happening</p>
          <div className="stat-row-side">
            <span className="stat-pill"><b>{user?.location ? "Shared" : "Hidden"}</b>your location</span>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="map-shell">
          <svg
            ref={svgRef}
            className="map-canvas"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <radialGradient id="ocean" cx="50%" cy="35%" r="75%">
                <stop offset="0%" stopColor="#132631" />
                <stop offset="100%" stopColor="#060b0f" />
              </radialGradient>
            </defs>
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`} transform-origin="center">
              <path d={graticule} fill="url(#ocean)" />
              {countryPaths.map((c) => (
                <path key={c.id} d={c.d} className="map-country" />
              ))}
              {pinned.map((profile) => (
                <g
                  key={profile.__self ? "self" : profile.id}
                  className={`map-pin ${profile.__self ? "self" : ""}`}
                  transform={`translate(${profile.x} ${profile.y})`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setSelected(profile)}
                >
                  <circle className="map-pin-pulse" r="9" />
                  <circle className="map-pin-ring" r="7.5" />
                  <foreignObject x="-9" y="-9" width="18" height="18">
                    <div className="map-pin-avatar">
                      <Avatar user={profile} />
                    </div>
                  </foreignObject>
                </g>
              ))}
            </g>
          </svg>

          <div className="map-zoom-controls">
            <button type="button" onClick={() => setView((v) => ({ ...v, k: clamp(v.k * 1.3, 1, 8) }))} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => setView((v) => ({ ...v, k: clamp(v.k / 1.3, 1, 8) }))} aria-label="Zoom out">−</button>
            <button type="button" onClick={resetView} aria-label="Reset view" title="Reset view">⟲</button>
          </div>

          {selected && (
            <div className="map-card" onClick={(event) => event.stopPropagation()}>
              <button className="map-card-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
              <strong>{selected.__self ? "You" : selected.username}</strong>
              <span className="map-card-avg">{selected.__self ? "This is you" : "Public Daymap"}</span>
              {!selected.__self && (
                <button className="soft-button" onClick={() => navigate("profile", selected.username)}>
                  View public profile
                </button>
              )}
            </div>
          )}
        </div>

        {!user?.location && (
          <p className="map-hint">
            We couldn't read your location (permission denied or unavailable). You can retry by re-logging in and allowing location access.
          </p>
        )}
      </div>
    </Shell>
  );
}
