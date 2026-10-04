import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;
const KEEP = 30;

/** Vercel Cron gọi mỗi ngày (xem vercel.json). Yêu cầu biến CRON_SECRET; Vercel tự gửi kèm Authorization: Bearer <CRON_SECRET>. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [moduleData, docFiles, users] = await Promise.all([
      db.moduleData.findMany(),
      db.docFile.findMany({ select: { documentId: true, version: true, size: true, note: true, createdAt: true } }),
      db.user.findMany({ select: { username: true, displayName: true, role: true, active: true } }),
    ]);
    const row = await db.backup.create({ data: { createdBy: null, note: "Sao lưu tự động hằng ngày", payload: { moduleData, docFiles, users, takenAt: new Date().toISOString() } as object } });
    const old = await db.backup.findMany({ orderBy: { createdAt: "desc" }, skip: KEEP, select: { id: true } });
    if (old.length) await db.backup.deleteMany({ where: { id: { in: old.map((x) => x.id) } } });
    await audit(null, "backup_auto", row.id, { rows: moduleData.length, pruned: old.length });
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("cron backup failed", e);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
