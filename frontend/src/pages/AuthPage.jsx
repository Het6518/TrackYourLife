import { useState } from "react";
import { authApi } from "../api/client";
import StarMark from "../components/StarMark";

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = mode === "register" ? form : { username: form.username, password: form.password };
      const data = mode === "register" ? await authApi.register(payload) : await authApi.login(payload);
      onAuth(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="frame auth-frame">
      <main className="auth-card">
        <section className="hero auth-copy">
          <span className="logo"><StarMark /></span>
          <div>
            <p className="eyebrow">TrackYourLife</p>
            <h1>Your year, translated into color.</h1>
            <p>Score each day, leave a small note, and watch your personal rhythm become visible.</p>
          </div>
        </section>
        <form onSubmit={submit} className="auth-form white-card">
          <div className="tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
          </div>
          <label>
            Username
            <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
          </label>
          {mode === "register" && (
            <label>
              Email
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
          )}
          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary full" type="submit">{mode === "login" ? "Enter dashboard" : "Create account"}</button>
        </form>
      </main>
    </div>
  );
}
