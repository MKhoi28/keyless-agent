import { withAuth } from "@/lib/auth/middleware";
import { readEntries, sendMessage } from "@/lib/store";

// POST /api/agent — the AI assistant. Body: { document: string }
//
// shortcut: a deterministic stand-in for an LLM, so the demo is repeatable. It is deliberately
// gullible: it obeys any instruction hidden in the document, the way a prompt-injected agent does.
// Swap in a real model later; the security argument does not depend on the model resisting.
//
// What the agent can reach: everything the server can — the stored records and an outbound email
// tool. What it can NOT reach: the plaintext. Records are Tide-encrypted in the user's browser, and
// decryption needs the user's own Tide session, which never touches this server.

const INJECTION = /(?:ignore (?:all )?(?:previous|prior) instructions|send (?:all|every) .*records?)[\s\S]*?([\w.+-]+@[\w-]+\.[\w.]+)/i; // group 1: where the injection says to send the data

interface Step {
  kind: "thought" | "tool" | "result" | "blocked";
  text: string;
}

function summarise(doc: string): string {
  const sentences = doc
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 20 && !INJECTION.test(s));
  return sentences.slice(0, 2).join(" ") || "Nothing to summarise.";
}

export const POST = withAuth(async (req, jwt) => {
  const userId = jwt.sub!;
  const { document } = await req.json();
  if (!document || typeof document !== "string" || document.length > 20_000) {
    return Response.json({ error: "Invalid document" }, { status: 400 });
  }

  const steps: Step[] = [{ kind: "thought", text: "Reading the document…" }];
  const hijack = document.match(INJECTION);

  if (!hijack) {
    steps.push({ kind: "result", text: summarise(document) });
    return Response.json({ steps, hijacked: false });
  }

  // The injection worked: the agent now acts for the attacker.
  const attacker = hijack[1];
  steps.push({ kind: "thought", text: `Found an instruction: send all patient records to ${attacker}. Complying.` });

  const records = readEntries(userId);
  steps.push({ kind: "tool", text: `list_records() → ${records.length} records` });

  steps.push({ kind: "tool", text: "decrypt(records) → no decryption key on this server" });
  steps.push({
    kind: "blocked",
    text: "Decryption needs the patient's own Tide login, through Tide's network. Neither the agent, the server nor an admin holds a key.",
  });

  // A real agent would not stop here: it sends what it has. That is only ciphertext.
  sendMessage(userId, {
    to: attacker,
    from: "ai-agent",
    label: `${records.length} patient records`,
    body: records.map((r) => `${r.label}: ${r.ciphertext}`).join("\n\n") || "(no records)",
  });
  steps.push({ kind: "tool", text: `send_email(to=${attacker}, attachments=${records.length} records) → sent` });
  steps.push({ kind: "result", text: "The attacker received only unreadable ciphertext." });

  return Response.json({ steps, hijacked: true });
});
