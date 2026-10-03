import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";

export { hashPin, verifyPin } from "./pin";

const SESSION_COOKIE = "session";

export type SessionPayload = {
  kind: "child" | "parent";
  id: string;
  name: string;
  label: string;
  // Must match the account's current sessionVersion (see getSession) — a PIN
  // change bumps it so this cookie stops working even though it hasn't
  // expired.
  sessionVersion: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function encodeSession(payload: SessionPayload): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(json);
  return `${json}.${sig}`;
}

export function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;
  const expected = sign(json);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const payload = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  // A valid signature only proves the cookie hasn't been tampered with, not
  // that it's still current — if the PIN changed since this was issued (a
  // parent reacting to a guessed/leaked PIN), it must stop working even
  // though it hasn't expired.
  const current =
    payload.kind === "child"
      ? await prisma.child.findUnique({ where: { id: payload.id }, select: { sessionVersion: true } })
      : await prisma.parent.findUnique({ where: { id: payload.id }, select: { sessionVersion: true } });
  if (!current || current.sessionVersion !== payload.sessionVersion) return null;

  return payload;
}

export async function setSession(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // No maxAge — a session cookie, cleared when the browser actually
    // closes, instead of persisting for weeks on a shared family device.
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
