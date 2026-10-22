"use client";

import { useTide } from "@/lib/tide";

export default function HomePage() {
  const { authenticated, getValueFromIdToken, login, logout, isInitializing } =
    useTide();

  if (isInitializing) {
    return <p>Loading...</p>;
  }

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
        <h1>Keyless Agent</h1>
        <p style={{ color: "#999", marginBottom: "2rem" }}>
          A clinic AI assistant that can never take patient data out on its own.
        </p>
        <button onClick={login} style={btnStyle}>
          Login with Tide
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
      <h1>Keyless Agent</h1>
      <p>Welcome, {getValueFromIdToken("preferred_username")}</p>
      <nav style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
        <a href="/agent" style={btnStyle}>
          Open assistant
        </a>
        <button onClick={logout} style={{ ...btnStyle, background: "#333" }}>
          Logout
        </button>
      </nav>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "0.75rem 1.5rem",
  fontSize: "1rem",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};
