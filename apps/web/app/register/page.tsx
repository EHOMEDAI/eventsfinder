"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../components/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.register(form);
      setSession(response.token, response.account);
      router.push("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-grid">
      <div className="hero">
        <span className="eyebrow">User Registration</span>
        <h1>Create a demo account</h1>
        <p style={{ margin: 0 }}>
          Public sign-up is limited to standard users in this MVP. Admin access stays seeded to keep the review flow controlled.
        </p>
      </div>

      <form className="panel stack" onSubmit={handleSubmit}>
        <h2 style={{ margin: 0 }}>Sign Up</h2>
        <div className="field-grid">
          <div className="field">
            <label>
              Display name
              <input
                value={form.displayName}
                onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                required
              />
            </label>
          </div>
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
              Phone number (optional)
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
          </div>
          <div className="field">
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>
          </div>
        </div>
        {error ? <div className="message status-danger">{error}</div> : null}
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <p className="muted" style={{ margin: 0 }}>
          Already registered? <Link href="/login">Go to login</Link>
        </p>
      </form>
    </section>
  );
}
