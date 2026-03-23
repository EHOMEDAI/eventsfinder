"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.login(form);
      setSession(response.token, response.account);
      router.push(response.account.roles.includes("ADMIN") ? "/admin" : "/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-grid">
      <div className="hero">
        <span className="eyebrow">Demo Accounts</span>
        <h1>Access EventsFinder</h1>
        <p style={{ margin: 0 }}>
          Admin account: `admin@eventsfinder.local` / `Password123!`
          <br />
          User account: `user@eventsfinder.local` / `Password123!`
        </p>
      </div>

      <form className="panel stack" onSubmit={handleSubmit}>
        <h2 style={{ margin: 0 }}>Log In</h2>
        <div className="field-grid">
          <div className="field">
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="field">
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>
          </div>
        </div>
        {error ? <div className="message status-danger">{error}</div> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Log In"}
        </button>
        <p className="muted" style={{ margin: 0 }}>
          Need an account? <Link href="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}
