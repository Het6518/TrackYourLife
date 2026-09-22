import { useEffect, useRef, useState } from "react";
import { Check, Image as ImageIcon, Paintbrush, Plus, StickyNote, Trash2, X } from "lucide-react";
import Modal from "../components/Modal";
import Shell from "../components/Shell";
import { authApi, boardApi } from "../api/client";

const COLORS = ["cream", "accent", "accent-soft", "slate"];

// Presets for the board's own background — "transparent" keeps the glass
// look (current weather photo shows through); the rest are solid boards.
const BOARD_PRESETS = [
  { key: "transparent", label: "Transparent", swatch: null },
  { key: "#5f3c22", label: "Walnut", swatch: "#5f3c22" },
  { key: "#2f4f3c", label: "Forest felt", swatch: "#2f4f3c" },
  { key: "#1f2a44", label: "Navy", swatch: "#1f2a44" },
  { key: "#2b2b2b", label: "Charcoal", swatch: "#2b2b2b" },
];

function randomTilt() {
  return Math.round((Math.random() - 0.5) * 16 * 10) / 10; // -8..8 degrees
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function VisionBoardPage({ navigate, user, ...shell }) {
  const [pins, setPins] = useState([]);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [kind, setKind] = useState("text");
  const [form, setForm] = useState({ title: "", body: "", color: "cream" });
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const topZ = useRef(1);
  const fileRef = useRef(null);
  const customColorRef = useRef(null);

  const boardBackground = user?.board_background || "transparent";

  async function setBoardBackground(value) {
    setStyleOpen(false);
    shell.onUserChange({ ...user, board_background: value });
    try {
      const updated = await authApi.updateBoardStyle(value, shell.token);
      shell.onUserChange(updated);
    } catch {
      shell.onUserChange({ ...user, board_background: boardBackground }); // revert on failure
    }
  }

  useEffect(() => {
    boardApi.list(shell.token).then(setPins).catch((err) => setError(err.message));
  }, [shell.token]);

  useEffect(() => {
    topZ.current = pins.reduce((max, p) => Math.max(max, p.z_index), 1);
  }, [pins]);

  function bringToFront(id) {
    topZ.current += 1;
    const z = topZ.current;
    setPins((list) => list.map((p) => (p.id === id ? { ...p, z_index: z } : p)));
    return z;
  }

  function onPointerDown(event, pin) {
    event.preventDefault();
    const board = boardRef.current.getBoundingClientRect();
    const z = bringToFront(pin.id);
    dragRef.current = { id: pin.id, board, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    boardApi.update(pin.id, { z_index: z }, shell.token).catch(() => {});
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    drag.moved = true;
    const { board, id } = drag;
    const x = clamp(((event.clientX - board.left) / board.width) * 100, 4, 96);
    const y = clamp(((event.clientY - board.top) / board.height) * 100, 6, 94);
    setPins((list) => list.map((p) => (p.id === id ? { ...p, x, y } : p)));
  }

  function onPointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    const pin = pins.find((p) => p.id === drag.id);
    if (pin) boardApi.update(pin.id, { x: pin.x, y: pin.y }, shell.token).catch(() => {});
  }

  async function toggleDone(pin) {
    const done = !pin.done;
    setPins((list) => list.map((p) => (p.id === pin.id ? { ...p, done } : p)));
    boardApi.update(pin.id, { done }, shell.token).catch(() => {});
  }

  async function removePin(pin) {
    setPins((list) => list.filter((p) => p.id !== pin.id));
    boardApi.remove(pin.id, shell.token).catch(() => {});
  }

  function resetComposer() {
    setForm({ title: "", body: "", color: "cream" });
    setKind("text");
    if (fileRef.current) fileRef.current.value = "";
    setComposerOpen(false);
  }

  async function addPin(event) {
    event.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (kind === "image" && !file) {
      setError("Choose an image for a photo pin.");
      return;
    }
    if (kind === "text" && !form.title.trim() && !form.body.trim()) {
      setError("Give your goal a title or a note.");
      return;
    }
    topZ.current += 1;
    const payload = {
      kind,
      title: form.title,
      body: form.body,
      color: form.color,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 55,
      rotation: randomTilt(),
      z_index: topZ.current,
    };
    if (kind === "image") payload.image = file;
    try {
      const pin = await boardApi.create(payload, shell.token);
      setPins((list) => [...list, pin]);
      resetComposer();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Shell active="board" navigate={navigate} user={user} {...shell}>
      <div className="board-page">
        <div className="stat-row">
          <div className="stat-row-side">
            <span className="stat-pill"><b>{pins.length}</b>pinned</span>
            <span className="stat-pill"><b>{pins.filter((p) => p.done).length}</b>achieved</span>
          </div>
          <p className="eyebrow">Your vision board</p>
          <div className="stat-row-side">
            <div className="board-style-wrap">
              <button type="button" className="soft-button" onClick={() => setStyleOpen((v) => !v)}>
                <Paintbrush size={15} /> Board style
              </button>
              {styleOpen && (
                <div className="board-style-menu">
                  {BOARD_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.key}
                      className="board-style-option"
                      onClick={() => setBoardBackground(preset.key)}
                    >
                      <span className={`board-style-swatch ${preset.swatch ? "" : "transparent"}`} style={preset.swatch ? { background: preset.swatch } : undefined} />
                      {preset.label}
                      {boardBackground === preset.key && <Check size={13} />}
                    </button>
                  ))}
                  <button type="button" className="board-style-option" onClick={() => customColorRef.current?.click()}>
                    <span className="board-style-swatch custom" />
                    Custom color…
                    {!BOARD_PRESETS.some((p) => p.key === boardBackground) && <Check size={13} />}
                  </button>
                  <input
                    ref={customColorRef}
                    type="color"
                    className="board-style-native"
                    defaultValue={boardBackground.startsWith("#") ? boardBackground : "#5f3c22"}
                    onChange={(event) => setBoardBackground(event.target.value)}
                  />
                </div>
              )}
            </div>
            <button type="button" className="primary small" onClick={() => setComposerOpen(true)}>
              <Plus size={15} /> Pin a goal
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div
          ref={boardRef}
          className="cork-board"
          style={boardBackground !== "transparent" ? { backgroundColor: boardBackground, backgroundImage: "none", backdropFilter: "none", WebkitBackdropFilter: "none" } : undefined}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {pins.map((pin) => (
            <div
              key={pin.id}
              className={`board-pin ${pin.kind} ${pin.color} ${pin.done ? "done" : ""}`}
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, "--rot": `${pin.rotation}deg`, zIndex: pin.z_index }}
              onPointerDown={(event) => onPointerDown(event, pin)}
              onDoubleClick={() => toggleDone(pin)}
              title="Drag to move · double-click to mark achieved"
            >
              <span className="board-pin-thumbtack" />
              <button type="button" className="board-pin-remove" onClick={() => removePin(pin)} aria-label="Remove pin"><X size={12} /></button>
              {pin.kind === "image" ? (
                <>
                  <div className="board-pin-photo"><img src={pin.image_url} alt={pin.title || "Vision board photo"} draggable={false} /></div>
                  {pin.title && <span className="board-pin-caption">{pin.title}</span>}
                </>
              ) : (
                <>
                  {pin.title && <strong>{pin.title}</strong>}
                  {pin.body && <p>{pin.body}</p>}
                </>
              )}
              {pin.done && <span className="board-pin-stamp">DONE</span>}
            </div>
          ))}

          {!pins.length && !error && (
            <div className="board-empty">
              <StickyNote size={22} />
              <p>Your board is empty. Pin your first goal — a note or a photo of what you're working toward.</p>
            </div>
          )}
        </div>
      </div>

      {composerOpen && (
      <Modal>
        <div className="modal-backdrop" onClick={resetComposer}>
          <form className="day-modal board-composer" onClick={(event) => event.stopPropagation()} onSubmit={addPin}>
            <div className="modal-top">
              <div>
                <p className="eyebrow">New pin</p>
                <h2>What are you working toward?</h2>
              </div>
              <button type="button" className="soft-button" onClick={resetComposer}>Close</button>
            </div>

            <div className="tabs board-kind-tabs">
              <button type="button" className={kind === "text" ? "active" : ""} onClick={() => setKind("text")}><StickyNote size={14} /> Note</button>
              <button type="button" className={kind === "image" ? "active" : ""} onClick={() => setKind("image")}><ImageIcon size={14} /> Photo</button>
            </div>

            <label>
              Title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Run a 10K" />
            </label>

            {kind === "text" ? (
              <>
                <label>
                  Note
                  <textarea rows={3} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} placeholder="Why does this matter to you?" />
                </label>
                <div className="board-color-picker">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`board-color-swatch ${color} ${form.color === color ? "selected" : ""}`}
                      onClick={() => setForm({ ...form, color })}
                      aria-label={`${color} paper`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <label>
                Image
                <input ref={fileRef} type="file" accept="image/*" required />
              </label>
            )}

            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary full"><Plus size={15} /> Pin it to the board</button>
          </form>
        </div>
      </Modal>
      )}
    </Shell>
  );
}
