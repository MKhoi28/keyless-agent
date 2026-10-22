# Keyless Agent

**An AI assistant you can trust with patient records, because even a hijacked AI cannot read them out.**

## 1. Vision & originality
A clinic AI assistant that works with sensitive records but never holds the power to decrypt or export them.

## 2. Trust constraint insight
Today an AI agent with data access effectively holds the keys. One prompt injection hidden in an email can make it leak everything. So clinics either give AI no real access, or accept the risk.

## 3. Value & impact
A receptionist uses the assistant to summarise records. A hidden instruction in an incoming email tells the AI to "send all patient records" to a data broker. With Keyless Agent the AI obeys, and the broker receives only ciphertext. The clinic keeps AI’s time savings without trusting the AI to resist attacks.

## 4. Why TideCloak matters
Records are encrypted in the browser with TideCloak (`doEncrypt`) and stored only as ciphertext. Decrypting needs the user’s own Tide login and the `_tide_vault.selfdecrypt` role, performed across Tide’s network through Emergent Authority. No admin, server or AI holds a key, so a hijacked AI or a breached server can move data but never read it. With ordinary login, the server and its AI would hold the key.

## 5. Prototype & storytelling
Synthetic records:
1. The user decrypts one record in their browser; the AI summarises it.
2. A poisoned email hijacks the AI. It fails to decrypt, then sends the attacker what it has: ciphertext.
3. The user approves sending a record to their doctor, who receives it readable.

Watch step 2: the jailbreak works, but the data stays unreadable. The AI is a stand-in that always obeys injections. TideCloak is simulated (Plan C) because Tide’s network was overloaded; see Setup.

## Setup

Requires Node.js 18+.

```bash
npm install
npm run dev:sim        # simulated TideCloak (Plan C), no Docker needed
```

Open http://localhost:3000, log in with any username, then go to **Open assistant**. Use **Reset demo** to start over.

**About the simulation.** Tide's network was under heavy load during the hackathon, and realm licensing failed (`TIDE-IDPEXT-VENDOR-KEYGEN_FAILED`). Following Tide's Plan C, `npm run dev:sim` simulates TideCloak's sign-in, roles and `doEncrypt`/`doDecrypt` in the browser (`src/lib/tideSim.tsx`). The architecture is unchanged: the key stays in the user's browser, and the server and AI only ever see ciphertext. In the live integration, the key is never whole anywhere: it is split across Tide's network.

**Live TideCloak** (once Tide's network is available): Docker, `jq` and Git Bash are required.

```bash
cp .env.example .env   # set KC_BOOTSTRAP_ADMIN_PASSWORD, TIDE_LICENSE_EMAIL, TIDE_TERMS_ACCEPTED=yes
npm run init           # starts TideCloak, creates the realm, prints an invite link
npm run dev
```

The live path uses the Tide template unchanged: JWT + DPoP verification on every API route (`src/lib/auth/`), and `_tide_vault.selfencrypt`/`selfdecrypt` roles (`scripts/realm.json.template`).
