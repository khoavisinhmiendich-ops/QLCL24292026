import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, checkPasskey, isLocked, recordAttempt, sessionCookie, signSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { Role } from "@/lib/rbac";

const Body = z.object({ username: z.string().min(1).max(64), passkey: z.string().min(1).max(200) });
const bad = (m: string, s = 401) => NextResponse.json({ error: m }, { status: s });

export async function POST(req: Request) {
  try { assertSameOrigin(); } catch (r) { return r as Response; }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Dữ liệu không hợp lệ", 400);
  const { username, passkey } = parsed.data;
  const key = username.toLowerCase();
  if (await isLocked(key)) return bad("Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau 15 phút.", 429);
  const user = await db.user.findUnique({ where: { username: key } });
  const ok = !!user && user.active && (await checkPasskey(passkey, user.passkeyHash));
  await recordAttempt(key, ok);
  if (!ok || !user) { await audit(user?.id ?? null, "login_failed", key); return bad("Sai tài khoản hoặc pass key"); }
  const token = await signSession({ uid: user.id, username: user.username, name: user.displayName, role: user.role as Role });
  await audit(user.id, "login", key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(token));
  return res;
}
