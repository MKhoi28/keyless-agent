"use client";

import { useTide } from "@/lib/tide";

export default function HomePage() {
  const { authenticated, getValueFromIdToken, login, logout, isInitializing } = useTide();

  if (isInitializing) return <div className="container muted">Loading…</div>;

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">🔐</span> Keyless Agent
        </div>
        {authenticated && (
          <div className="topbar-actions">
            <span className="user-chip">
              <span className="avatar">{String(getValueFromIdToken("preferred_username") ?? "?")[0].toUpperCase()}</span>
              {getValueFromIdToken("preferred_username")}
            </span>
            <button onClick={logout} className="btn btn-ghost btn-sm">Log out</button>
          </div>
        )}
      </div>

      <section className="hero">
        <span className="hero-eyebrow">🩺 Clinic AI assistant · built with TideCloak</span>
        <h1>
          An AI that can read patient records, <span className="gradient-text">but never take them.</span>
        </h1>
        <p className="lead">
          Keyless Agent summarises records and drafts referrals. Even if a hidden prompt injection hijacks it, the data it
          leaks is unreadable, because no AI, server or admin ever holds the key.
        </p>
        {authenticated ? (
          <a href="/agent" className="btn btn-lg">Open assistant →</a>
        ) : (
          <button onClick={login} className="btn btn-lg">Log in with Tide</button>
        )}

        <div className="features">
          <div className="card feature">
            <div className="feature-icon">🔒</div>
            <h3>Encrypted in your browser</h3>
            <p>Records are stored only as ciphertext. The server never sees a patient&apos;s name or diagnosis.</p>
          </div>
          <div className="card feature">
            <div className="feature-icon">🤖</div>
            <h3>AI with no master key</h3>
            <p>The assistant works on what you choose to share. It can&apos;t decrypt anything on its own.</p>
          </div>
          <div className="card feature">
            <div className="feature-icon">✅</div>
            <h3>You approve every export</h3>
            <p>Sending a record needs your own Tide login, so a hijacked AI can&apos;t do it for you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
