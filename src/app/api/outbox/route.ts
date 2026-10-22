import { withAuth } from "@/lib/auth/middleware";
import { readOutbox, sendMessage, writeEntries, writeJson } from "@/lib/store";

// Mock email: every message the app "sends" lands here so the demo can show who received what.

// GET /api/outbox — messages sent on behalf of the authenticated user
export const GET = withAuth(async (_req, jwt) => {
  return Response.json({ messages: readOutbox(jwt.sub!) });
});

// POST /api/outbox — the user-approved export. Body: { to, label, body }
// The plaintext arrives here only because the user decrypted it in their own browser with Tide.
export const POST = withAuth(async (req, jwt) => {
  const { to, label, body } = await req.json();
  if (typeof to !== "string" || !/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(to)) {
    return Response.json({ error: "Invalid recipient" }, { status: 400 });
  }
  if (typeof label !== "string" || typeof body !== "string" || body.length > 20_000) {
    return Response.json({ error: "Invalid message" }, { status: 400 });
  }
  sendMessage(jwt.sub!, { to, from: "you (approved)", label, body });
  return Response.json({ success: true }, { status: 201 });
});

// DELETE /api/outbox — reset the demo: clears this user's sent mail and stored records
export const DELETE = withAuth(async (_req, jwt) => {
  writeJson(`outbox/${jwt.sub!}.json`, []);
  writeEntries(jwt.sub!, []);
  return Response.json({ success: true });
});
