import { useState } from "react";
import { authApi } from "../api/client";
import Modal from "./Modal";

// Rename + change password, opened from the avatar menu. Each form saves on
// its own so a typo in one never blocks the other.
export default function AccountSettings({ user, token, onUserChange, onTokenChange, navigate, onClose }) {
  const [username, setUsername] = useState(user.username);
  const [nameStatus, setNameStatus] = useState({ busy: false, error: "", done: false });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passStatus, setPassStatus] = useState({ busy: false, error: "", done: false });

  async function saveUsername(event) {
    event.preventDefault();
    const trimmed = username.trim();
    if (trimmed === user.username) return;
    setNameStatus({ busy: true, error: "", done: false });
    try {
      const updated = await authApi.updateUsername(trimmed, token);
      // the old /<username> URL is dead now — follow the rename if we're on it
      const onOwnProfile = window.location.pathname === `/${user.username}`;
      onUserChange(updated);
      if (onOwnProfile) navigate("profile", updated.username);
      setNameStatus({ busy: false, error: "", done: true });
    } catch (err) {
      setNameStatus({ busy: false, error: err.message, done: false });
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPassStatus({ busy: false, error: "New passwords don't match.", done: false });
      return;
    }
    setPassStatus({ busy: true, error: "", done: false });
    try {
      const { token: newToken } = await authApi.changePassword(passwords.current, passwords.next, token);
      onTokenChange(newToken); // the old token was revoked server-side
      setPasswords({ current: "", next: "", confirm: "" });
      setPassStatus({ busy: false, error: "", done: true });
    } catch (err) {
      setPassStatus({ busy: false, error: err.message, done: false });
    }
  }

  return (
    <Modal>
      <div className="modal-backdrop" onClick={onClose}>
        <article className="day-modal account-settings" onClick={(event) => event.stopPropagation()}>
          <div className="modal-top">
            <div>
              <p className="eyebrow">Account</p>
              <h2>Settings</h2>
            </div>
            <button type="button" className="soft-button" onClick={onClose}>Close</button>
          </div>

          <form className="account-settings-form" onSubmit={saveUsername}>
            <label>
              Username
              <input
                value={username}
                onChange={(event) => { setUsername(event.target.value); setNameStatus({ busy: false, error: "", done: false }); }}
                maxLength={150}
                required
              />
            </label>
            <p className="theme-settings-hint">Your profile link changes to /{username.trim() || "…"}. Letters, digits and @ . + - _ only.</p>
            {nameStatus.error && <p className="error">{nameStatus.error}</p>}
            {nameStatus.done && <p className="success">Username updated.</p>}
            <button className="primary small" type="submit" disabled={nameStatus.busy || !username.trim() || username.trim() === user.username}>
              {nameStatus.busy ? "Saving…" : "Save username"}
            </button>
          </form>

          <form className="account-settings-form" onSubmit={savePassword}>
            <label>
              Current password
              <input type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required />
            </label>
            <label>
              New password
              <input type="password" autoComplete="new-password" minLength={8} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} required />
            </label>
            <label>
              Confirm new password
              <input type="password" autoComplete="new-password" minLength={8} value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} required />
            </label>
            <p className="theme-settings-hint">At least 8 characters. Other devices will be signed out.</p>
            {passStatus.error && <p className="error">{passStatus.error}</p>}
            {passStatus.done && <p className="success">Password changed.</p>}
            <button className="primary small" type="submit" disabled={passStatus.busy}>
              {passStatus.busy ? "Saving…" : "Change password"}
            </button>
          </form>
        </article>
      </div>
    </Modal>
  );
}
