import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, hashPasskey, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const Role = z.enum(["ADMIN", "MANAGER", "USER", "VIEWER"]);
const err = (r: unknown) => (r instanceof Response ? r : NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 }));
const bad = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });

export async function GET() {
  try {
    await requireRole("admin");
    const users = await db.user.findMany({ select: { id: true, username: true, displayName: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ users });
  } catch (e) { return err(e); }
}

const Create = z.object({
  username: z.string().regex(/^[a-z0-9._-]{3,32}$/, "Tên đăng nhập 3-32 ký tự: chữ thường không dấu, số, . _ -"),
  displayName: z.string().min(1).max(80),
  role: Role,
  passkey: z.string().min(10, "Pass key tối thiểu 10 ký tự").max(200),
});
export async function POST(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("admin");
    const p = Create.safeParse(await req.json().catch(() => null));
    if (!p.success) return bad(p.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
    if (await db.user.findUnique({ where: { username: p.data.username } })) return bad("Tên đăng nhập đã tồn tại", 409);
    const u = await db.user.create({ data: { username: p.data.username, displayName: p.data.displayName, role: p.data.role, passkeyHash: await hashPasskey(p.data.passkey) } });
    await audit(s.uid, "user_create", u.username, { role: u.role });
    return NextResponse.json({ ok: true, id: u.id });
  } catch (e) { return err(e); }
}

const Patch = z.object({ id: z.string(), role: Role.optional(), active: z.boolean().optional(), displayName: z.string().min(1).max(80).optional(), passkey: z.string().min(10, "Pass key tối thiểu 10 ký tự").max(200).optional() });
export async function PATCH(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("admin");
    const p = Patch.safeParse(await req.json().catch(() => null));
    if (!p.success) return bad(p.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
    const { id, role, active, displayName, passkey } = p.data;
    const target = await db.user.findUnique({ where: { id } });
    if (!target) return bad("Không tìm thấy tài khoản", 404);
    if (id === s.uid && ((role && role !== "ADMIN") || active === false)) return bad("Không thể hạ quyền hoặc khóa chính tài khoản đang đăng nhập");
    if (target.role === "ADMIN" && ((role && role !== "ADMIN") || active === false)) {
      const admins = await db.user.count({ where: { role: "ADMIN", active: true } });
      if (admins <= 1) return bad("Phải còn ít nhất một quản trị viên đang hoạt động");
    }
    await db.user.update({ where: { id }, data: { ...(role ? { role } : {}), ...(active !== undefined ? { active } : {}), ...(displayName ? { displayName } : {}), ...(passkey ? { passkeyHash: await hashPasskey(passkey) } : {}) } });
    if (passkey) await db.loginAttempt.deleteMany({ where: { key: target.username } });
    await audit(s.uid, passkey ? "passkey_reset" : "user_update", target.username, { role, active });
    return NextResponse.json({ ok: true });
  } catch (e) { return err(e); }
}
