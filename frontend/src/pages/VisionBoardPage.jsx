import { useEffect, useRef, useState } from "react";
import { Check, Image as ImageIcon, Paintbrush, Plus, StickyNote, Trash2, Undo2 } from "lucide-react";
import Modal from "../components/Modal";
import SearchBar from "../components/SearchBar";
import Shell from "../components/Shell";
import { authApi, boardApi } from "../api/client";
import { prepareImage } from "../utils/image";

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

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// "2026-10" in the user's local time zone — sorts chronologically as a string
function monthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

function sortByCompleted(list) {
  return [...list].sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
}

export default function VisionBoardPage({ navigate, user, ...shell }) {
  const [pins, setPins] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [kind, setKind] = useState("text");
  const [form, setForm] = useState({ title: "", body: "", color: "cream" });
  const [history, setHistory] = useState([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyMonth, setHistoryMonth] = useState("all");
  const [editing, setEditing] = useState(null); // { pin, title, body, color, done } while the edit modal is open
  const [editError, setEditError] = useState("");
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
    boardApi.history(shell.token).then(setHistory).catch((err) => setError(err.message));
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
    // half the pin's on-screen size (tilt included, plus room for the
    // thumbtack/remove button), as % of the board, so it can't be dragged
    // partly off the edge
    const rect = event.currentTarget.getBoundingClientRect();
    const halfW = ((rect.width / 2 + 12) / board.width) * 100;
    const halfH = ((rect.height / 2 + 12) / board.height) * 100;
    dragRef.current = { id: pin.id, board, halfW, halfH, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    boardApi.update(pin.id, { z_index: z }, shell.token).catch(() => {});
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;
    drag.moved = true;
    const { board, id, halfW, halfH } = drag;
    const x = clamp(((event.clientX - board.left) / board.width) * 100, halfW, 100 - halfW);
    const y = clamp(((event.clientY - board.top) / board.height) * 100, halfH, 100 - halfH);
    setPins((list) => list.map((p) => (p.id === id ? { ...p, x, y } : p)));
  }

  function onPointerUp() {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || !drag.moved) return;
    const pin = pins.find((p) => p.id === drag.id);
    if (pin) boardApi.update(pin.id, { x: pin.x, y: pin.y }, shell.token).catch(() => {});
  }

  // keep the history list in sync with a pin's done state
  function syncHistory(pin) {
    setHistory((list) => {
      const rest = list.filter((p) => p.id !== pin.id);
      return pin.done ? sortByCompleted([...rest, pin]) : rest;
    });
  }

  async function toggleDone(pin) {
    const done = !pin.done;
    const optimistic = { ...pin, done, completed_at: done ? new Date().toISOString() : null };
    setPins((list) => list.map((p) => (p.id === pin.id ? optimistic : p)));
    syncHistory(optimistic);
    try {
      const updated = await boardApi.update(pin.id, { done }, shell.token);
      // take the server's completion time, but keep the local position/z
      setPins((list) => list.map((p) => (p.id === pin.id ? { ...p, completed_at: updated.completed_at } : p)));
      syncHistory({ ...optimistic, completed_at: updated.completed_at });
    } catch {
      setPins((list) => list.map((p) => (p.id === pin.id ? { ...p, done: pin.done, completed_at: pin.completed_at } : p)));
      syncHistory(pin);
    }
  }

  async function removePin(pin) {
    const name = pin.title || (pin.kind === "image" ? "this photo" : "this note");
    const message = pin.done
      ? `Remove "${name}" from your board? It stays in your achieved history.`
      : `Remove "${name}" from your board?`;
    if (!window.confirm(message)) return;
    setPins((list) => list.filter((p) => p.id !== pin.id));
    // the server archives completed pins instead of deleting them
    if (pin.done) setHistory((list) => list.map((p) => (p.id === pin.id ? { ...p, archived: true } : p)));
    try {
      await boardApi.remove(pin.id, shell.token);
    } catch (err) {
      setPins((list) => [...list, pin]); // put it back — the server still has it
      if (pin.done) syncHistory(pin);
      setError(err.message);
    }
  }

  async function deleteFromHistory(pin) {
    if (!window.confirm(`Permanently delete "${pin.title || pin.body || "this goal"}" from your history?`)) return;
    setHistory((list) => list.filter((p) => p.id !== pin.id));
    try {
      await boardApi.remove(pin.id, shell.token);
    } catch (err) {
      syncHistory(pin);
      setError(err.message);
    }
  }

  function openEdit(pin) {
    setEditError("");
    setEditing({ pin, title: pin.title, body: pin.body, color: pin.color, done: pin.done });
  }

  // edit a goal from the history panel; restore=true also puts an archived
  // goal back on the board (on top of everything else)
  async function saveEdit(event, restore = false) {
    event?.preventDefault();
    const { pin, title, body, color, done } = editing;
    const payload = { title, body, done };
    if (pin.kind === "text") payload.color = color;
    if (restore || (pin.archived && !done)) {
      topZ.current += 1;
      payload.archived = false;
      payload.z_index = topZ.current;
    }
    try {
      const updated = await boardApi.update(pin.id, payload, shell.token);
      setPins((list) => {
        if (updated.archived) return list.filter((p) => p.id !== updated.id);
        // keep the local position of a pin that's already on the board
        return list.some((p) => p.id === updated.id)
          ? list.map((p) => (p.id === updated.id ? { ...updated, x: p.x, y: p.y, z_index: p.z_index } : p))
          : [...list, updated];
      });
      syncHistory(updated);
      setEditing(null);
    } catch (err) {
      setEditError(err.message);
    }
  }

  // months that have at least one completion, newest first
  const historyMonths = [...new Set(history.filter((p) => p.completed_at).map((p) => monthKey(p.completed_at)))]
    .sort()
    .reverse();
  // falls back to "all" if the chosen month empties out (e.g. its last goal was deleted)
  const activeMonth = historyMonths.includes(historyMonth) ? historyMonth : "all";

  // month filter first, then free text over the title/note or either date
  // as displayed (e.g. "Oct 6", "2026")
  const historyTerm = historyQuery.trim().toLowerCase();
  const visibleHistory = history.filter((pin) => {
    if (activeMonth !== "all" && (!pin.completed_at || monthKey(pin.completed_at) !== activeMonth)) return false;
    if (!historyTerm) return true;
    return [pin.title, pin.body, formatDateTime(pin.created_at), formatDateTime(pin.completed_at)]
      .some((text) => (text || "").toLowerCase().includes(historyTerm));
  });

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
    setSaving(true);
    try {
      // a polaroid is ~150px on the board, ~470px in the edit modal
      if (kind === "image") payload.image = await prepareImage(file, { maxSize: 1600 });
      const pin = await boardApi.create(payload, shell.token);
      setPins((list) => [...list, pin]);
      resetComposer();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell active="board" navigate={navigate} user={user} {...shell}>
      <div className="board-page">
        <div className="stat-row">
          <div className="stat-row-side">
            <span className="stat-pill"><b>{pins.length}</b>pinned</span>
            <span className="stat-pill"><b>{history.length}</b>achieved</span>
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

        <div className="board-layout">
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
                {/* stopPropagation keeps the pin's drag handler from capturing
                    the pointer — capture retargets the click away from this button */}
                <button
                  type="button"
                  className="board-pin-remove"
                  onPointerDown={(event) => event.stopPropagation()}
                  onDoubleClick={(event) => event.stopPropagation()}
                  onClick={() => removePin(pin)}
                  title="Remove from board"
                  aria-label="Remove pin"
                >
                  <Trash2 size={12} />
                </button>
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

          <aside className="board-completed">
            <div className="board-completed-head">
              <p className="eyebrow">Achieved goals</p>
              <SearchBar value={historyQuery} onChange={setHistoryQuery} placeholder="Search goals or dates" />
              <select
                className="board-completed-month"
                value={activeMonth}
                onChange={(event) => setHistoryMonth(event.target.value)}
                aria-label="Filter by month completed"
              >
                <option value="all">All months</option>
                {historyMonths.map((key) => (
                  <option key={key} value={key}>{formatMonth(key)}</option>
                ))}
              </select>
            </div>

            {!history.length && <p className="empty-state">Double-click a pin to mark it achieved. It'll be kept here even after you take it off the board.</p>}
            {history.length > 0 && !visibleHistory.length && <p className="empty-state">No achieved goals match these filters.</p>}

            <ul className="board-completed-list">
              {visibleHistory.map((pin) => (
                <li
                  key={pin.id}
                  className="board-completed-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(pin)}
                  onKeyDown={(event) => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      openEdit(pin);
                    }
                  }}
                  title="Open to edit"
                >
                  <div className="board-completed-title">
                    <span className="board-completed-check"><Check size={13} /></span>
                    <strong>{pin.title || pin.body || (pin.kind === "image" ? "Photo pin" : "Untitled note")}</strong>
                    {pin.archived && (
                      <button
                        type="button"
                        className="board-completed-delete"
                        onClick={(event) => {
                          event.stopPropagation(); // don't also open the edit modal
                          deleteFromHistory(pin);
                        }}
                        title="Delete permanently"
                        aria-label="Delete permanently"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <span className="board-completed-dates">
                    <span>Created {formatDateTime(pin.created_at)}</span>
                    <span>Completed {formatDateTime(pin.completed_at)}</span>
                    {pin.archived && <span className="board-completed-tag">Off the board</span>}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      {editing && (
      <Modal>
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form className="day-modal board-composer" onClick={(event) => event.stopPropagation()} onSubmit={saveEdit}>
            <div className="modal-top">
              <div>
                <p className="eyebrow">{editing.pin.archived ? "Achieved · off the board" : "Achieved goal"}</p>
                <h2>Edit goal</h2>
              </div>
              <button type="button" className="soft-button" onClick={() => setEditing(null)}>Close</button>
            </div>

            {editing.pin.kind === "image" && editing.pin.image_url && (
              <img className="board-edit-photo" src={editing.pin.image_url} alt={editing.pin.title || "Vision board photo"} />
            )}

            <label>
              {editing.pin.kind === "image" ? "Caption" : "Title"}
              <input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            </label>

            {editing.pin.kind === "text" && (
              <>
                <label>
                  Note
                  <textarea rows={3} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} />
                </label>
                <div className="board-color-picker">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      className={`board-color-swatch ${color} ${editing.color === color ? "selected" : ""}`}
                      onClick={() => setEditing({ ...editing, color })}
                      aria-label={`${color} paper`}
                    />
                  ))}
                </div>
              </>
            )}

            <label className="board-edit-check">
              <input type="checkbox" checked={editing.done} onChange={(event) => setEditing({ ...editing, done: event.target.checked })} />
              Achieved
            </label>
            <p className="board-edit-dates">
              Created {formatDateTime(editing.pin.created_at)} · Completed {formatDateTime(editing.pin.completed_at)}
              {!editing.done && (editing.pin.archived
                ? " · Un-marking moves it back onto your board and out of this history."
                : " · Un-marking removes it from this history.")}
            </p>

            {editError && <p className="error">{editError}</p>}
            <div className="board-edit-actions">
              {editing.pin.archived && editing.done && (
                <button type="button" className="soft-button" onClick={() => saveEdit(null, true)}>
                  <Undo2 size={15} /> Save & put back on board
                </button>
              )}
              <button type="submit" className="primary"><Check size={15} /> Save</button>
            </div>
          </form>
        </div>
      </Modal>
      )}

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
            <button type="submit" className="primary full" disabled={saving}><Plus size={15} /> {saving ? "Pinning…" : "Pin it to the board"}</button>
          </form>
        </div>
      </Modal>
      )}
    </Shell>
  );
}
