"use client";

// Plan C: Tide's network was under heavy load during the hackathon, so this simulates the TideCloak
// pieces the app uses — sign-in, realm roles, doEncrypt/doDecrypt and secureFetch — with the same
// shape as @tidecloak/nextjs. Turn it off (NEXT_PUBLIC_TIDE_SIMULATED unset) to use live TideCloak.
//
// What stays true in simulation: the encryption key lives only in the user's browser, and decrypting
// needs the _tide_vault.selfdecrypt role. The server, and the AI agent on it, only ever see ciphertext.
// shortcut: in live Tide the key never exists whole anywhere — it is split across Tide's network and
// used only through the user's login. Here it is one AES key in localStorage. Switch back when Tide is up.

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ROLES = ["_tide_enabled", "appUser", "_tide_vault.selfencrypt", "_tide_vault.selfdecrypt"];

interface SimUser {
  sub: string;
  preferred_username: string;
  realm_access: { roles: string[] };
}

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function userKey(username: string): Promise<CryptoKey> {
  const slot = `sim-tide-key:${username}`;
  let raw = localStorage.getItem(slot);
  if (!raw) {
    raw = b64(crypto.getRandomValues(new Uint8Array(32)));
    localStorage.setItem(slot, raw);
  }
  return crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", false, ["encrypt", "decrypt"]);
}

function useSimState() {
  const [user, setUser] = useState<SimUser | null>(null);
  const [isInitializing, setInit] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem("sim-tide-user");
    if (saved) setUser(JSON.parse(saved));
    setInit(false);
  }, []);

  const [signingIn, setSigningIn] = useState(false);
  const login = useCallback(() => setSigningIn(true), []);

  const signIn = useCallback((name: string) => {
    const u: SimUser = { sub: `sim-${name}`, preferred_username: name, realm_access: { roles: ROLES } };
    sessionStorage.setItem("sim-tide-user", JSON.stringify(u));
    setUser(u);
    setSigningIn(false);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("sim-tide-user");
    setUser(null);
  }, []);

  const requireRole = (role: string) => {
    if (!user?.realm_access.roles.includes(role)) throw new Error(`Access denied: missing role ${role}`);
  };

  const doEncrypt = async (items: { data: string; tags: string[] }[]) => {
    const out: string[] = [];
    for (const { data, tags } of items) {
      tags.forEach((t) => requireRole(`_tide_${t}.selfencrypt`));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await userKey(user!.preferred_username), new TextEncoder().encode(data))
      );
      out.push(b64(new Uint8Array([...iv, ...ct])));
    }
    return out;
  };

  const doDecrypt = async (items: { encrypted: string; tags: string[] }[]) => {
    const out: string[] = [];
    for (const { encrypted, tags } of items) {
      tags.forEach((t) => requireRole(`_tide_${t}.selfdecrypt`));
      const bytes = unb64(encrypted);
      const pt = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes.slice(0, 12) },
        await userKey(user!.preferred_username),
        bytes.slice(12)
      );
      out.push(new TextDecoder().decode(pt));
    }
    return out;
  };

  // Stands in for Tide's DPoP-bound token: the server's withAuth reads it in simulated mode.
  const secureFetch = (url: string | URL | RequestInfo, init: RequestInit = {}) =>
    fetch(url, {
      ...init,
      headers: { ...(init.headers as Record<string, string>), Authorization: `Sim ${btoa(JSON.stringify(user))}` },
    });

  return {
    signingIn,
    signIn,
    cancelSignIn: () => setSigningIn(false),
    authenticated: !!user,
    isInitializing,
    login,
    logout,
    getValueFromIdToken: (key: string) => (user as any)?.[key],
    doEncrypt,
    doDecrypt,
    secureFetch,
  };
}

type SimTide = ReturnType<typeof useSimState>;
const Ctx = createContext<SimTide | null>(null);

export function SimTideProvider({ children }: { children: React.ReactNode }) {
  const value = useSimState();
  return (
    <Ctx.Provider value={value}>
      <div className="sim-banner">
        ⚠ Simulated TideCloak (Plan C): Tide&apos;s network was under heavy load, so sign-in, roles and encryption
        are simulated in this browser. The server and the AI still only ever see ciphertext.
      </div>
      {children}
      {value.signingIn && <SignInDialog onSubmit={value.signIn} onCancel={value.cancelSignIn} />}
    </Ctx.Provider>
  );
}

function SignInDialog({ onSubmit, onCancel }: { onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("dr.alice");
  return (
    <div className="overlay" onClick={onCancel}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSubmit(name.trim());
        }}
      >
        <div className="tide-mark">🔐 Secured by Tide · simulated</div>
        <h2>Sign in</h2>
        <p>Your key never leaves your browser. No server, admin or AI can sign in as you.</p>
        <label htmlFor="sim-username">Username</label>
        <input id="sim-username" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn">Continue</button>
        </div>
      </form>
    </div>
  );
}

export function useSimTide(): SimTide {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSimTide outside SimTideProvider");
  return v;
}
