import { NextRequest } from "next/server";
import { verifyTideJWT, hasRole, extractToken } from "./tideJWT";
import { verifyDpop } from "./verifyDpop";
import type { JWTPayload } from "jose";

type AuthHandler = (req: NextRequest, jwt: JWTPayload) => Promise<Response>;

// Plan C (see src/lib/tideSim.tsx): accept the simulated sign-in instead of a Tide JWT + DPoP proof.
// Off unless NEXT_PUBLIC_TIDE_SIMULATED=1; a simulated token is forgeable, so never enable it for real users.
const SIMULATED = process.env.NEXT_PUBLIC_TIDE_SIMULATED === "1";

function simulatedJwt(authHeader: string | null): JWTPayload {
  if (!authHeader?.startsWith("Sim ")) throw new Error("Missing simulated sign-in");
  const jwt = JSON.parse(Buffer.from(authHeader.slice(4), "base64").toString("utf-8"));
  if (typeof jwt?.sub !== "string") throw new Error("Invalid simulated sign-in");
  return jwt;
}

export function withAuth(handler: AuthHandler) {
  return async (req: NextRequest) => {
    if (SIMULATED) {
      try {
        return handler(req, simulatedJwt(req.headers.get("authorization")));
      } catch (err) {
        return Response.json({ error: err instanceof Error ? err.message : "Unauthorized" }, { status: 401 });
      }
    }
    try {
      const token = extractToken(req.headers.get("authorization"));
      const jwt = await verifyTideJWT(token);
      // The signature alone is not enough. This realm issues sender-constrained tokens (cnf.jkt),
      // and without checking the DPoP proof a stolen token replays as a plain `Bearer` and passes
      // (AP-43). verifyDpop rejects an unbound token, a Bearer-scheme replay, a proof signed by a
      // different key, and a proof for another URL or method. It throws; the catch below answers 401.
      await verifyDpop(req, token, jwt as { cnf?: { jkt?: string } });
      return handler(req, jwt);
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "Unauthorized" },
        { status: 401 }
      );
    }
  };
}

export function withRole(role: string, handler: AuthHandler) {
  return withAuth(async (req, jwt) => {
    if (!hasRole(jwt, role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return handler(req, jwt);
  });
}
