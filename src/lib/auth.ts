import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { can, type Action, type Role } from "./rbac";

export const COOKIE = "qlcl_session";
const TTL_SECONDS = 60 * 60 * 8;
export type Session = { uid: string; username: string; name: string; role: Role };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET chưa cấu hình (>= 32 ký tự)");
  return new TextEncoder().encode(s);
}
export async function signSession(s: Session) {
  return new SignJWT({ ...s }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${TTL_SECONDS}s`).sign(secret());
}
export async function readToken(token?: string): Promise<Session | null> {
  if (!token) return null;
  try { return (await jwtVerify(token, secret())).payload as unknown as Session; } catch { return null; }
}
export async function getSession() {
  return readToken(cookies().get(COOKIE)?.value);
}
export function sessionCookie(token: string) {
  return { name: COOKIE, value: token, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: TTL_SECONDS };
}
/** Dùng trong API route: trả về session hoặc ném Response lỗi. */
export async function requireRole(action: Action): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Response(JSON.stringify({ error: "Chưa đăng nhập" }), { status: 401 });
  if (!can(s.role, action)) throw new Response(JSON.stringify({ error: "Không đủ quyền" }), { status: 403 });
  return s;
}
/** Chặn CSRF cho request ghi: Origin phải trùng Host. */
export function assertSameOrigin() {
  const h = headers();
  const origin = h.get("origin");
  if (origin && new URL(origin).host !== h.get("host")) throw new Response(JSON.stringify({ error: "Origin không hợp lệ" }), { status: 403 });
}
export const hashPasskey = (p: string) => bcrypt.hash(p, 12);
export const checkPasskey = (p: string, h: string) => bcrypt.compare(p, h);

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
export async function isLocked(key: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const fails = await db.loginAttempt.count({ where: { key, ok: false, createdAt: { gte: since } } });
  return fails >= MAX_FAILS;
}
export const recordAttempt = (key: string, ok: boolean) => db.loginAttempt.create({ data: { key, ok } });
