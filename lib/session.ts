// Sign-in sessions. After you prove you own a wallet (by signing a message),
// we give your browser a cookie that says "this is 0x…", stamped with a secret
// only the server knows (HMAC), so nobody can fake it.

import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION = "perpy_session";
const NONCE = "perpy_nonce";
const DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET is not set");
  return s;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function check(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i), mac = signed.slice(i + 1);
  const good = Buffer.from(sign(value));
  const got = Buffer.from(mac);
  return good.length === got.length && timingSafeEqual(good, got) ? value : null;
}

const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge });

// A one-time random code the wallet has to sign, valid for 10 minutes.
export async function newNonce() {
  const nonce = randomBytes(12).toString("hex");
  const value = `${nonce}.${Date.now()}`;
  (await cookies()).set(NONCE, `${value}.${sign(value)}`, cookieOpts(600));
  return nonce;
}

export async function takeNonce(): Promise<string | null> {
  const jar = await cookies();
  const v = check(jar.get(NONCE)?.value);
  jar.delete(NONCE);
  if (!v) return null;
  const [nonce, at] = v.split(".");
  return Date.now() - +at < 600_000 ? nonce : null;
}

export async function startSession(address: string) {
  const value = `${address.toLowerCase()}.${Date.now() + DAYS * 86400_000}`;
  (await cookies()).set(SESSION, `${value}.${sign(value)}`, cookieOpts(DAYS * 86400));
}

export async function endSession() {
  (await cookies()).delete(SESSION);
}

// The signed-in wallet, or null.
export async function currentUser(): Promise<string | null> {
  try {
    const v = check((await cookies()).get(SESSION)?.value);
    if (!v) return null;
    const [address, exp] = v.split(".");
    return Date.now() < +exp && /^0x[0-9a-f]{40}$/.test(address) ? address : null;
  } catch {
    return null;
  }
}

// The exact text the wallet signs. Shown to the user in their wallet popup.
export function signInMessage(address: string, host: string, nonce: string, issuedAt: string) {
  return [
    `${host} wants you to sign in with your wallet:`,
    address,
    "",
    "Sign in to perpy. This is free: it can't move funds and costs no gas.",
    "",
    `URI: https://${host}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}
