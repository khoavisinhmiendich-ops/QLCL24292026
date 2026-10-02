import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const err = (r: unknown) => (r instanceof Response ? r : NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 }));

export async function GET() {
  try {
    await requireRole("manage");
    const list = await db.backup.findMany({ select: { id: true, note: true, createdAt: true, createdBy: true }, orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ backups: list });
  } catch (e) { return err(e); }
}
// Backup now: chụp toàn bộ dữ liệu người dùng nhập
export async function POST(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("manage");
    const note = ((await req.json().catch(() => ({}))) as { note?: string }).note ?? "Sao lưu thủ công";
    const moduleData = await db.moduleData.findMany();
    const row = await db.backup.create({ data: { createdBy: s.uid, note, payload: { moduleData, takenAt: new Date().toISOString() } as object } });
    await audit(s.uid, "backup", row.id, { rows: moduleData.length });
    return NextResponse.json({ ok: true, id: row.id, rows: moduleData.length });
  } catch (e) { return err(e); }
}
// Restore: ghi lại từng bản ghi thành version mới (không mất lịch sử hiện tại)
export async function PUT(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("admin");
    const { id } = (await req.json()) as { id: string };
    const bk = await db.backup.findUnique({ where: { id } });
    if (!bk) return NextResponse.json({ error: "Không tìm thấy bản sao lưu" }, { status: 404 });
    const rows = (bk.payload as { moduleData: Array<{ module: string; documentId: string | null; key: string; data: object }> }).moduleData;
    let n = 0;
    for (const r of rows) {
      await db.$transaction(async (tx) => {
        const cur = await tx.moduleData.findFirst({ where: { module: r.module, documentId: r.documentId, key: r.key } });
        const version = (cur?.version ?? 0) + 1;
        const row = cur
          ? await tx.moduleData.update({ where: { id: cur.id }, data: { data: r.data, version, userId: s.uid } })
          : await tx.moduleData.create({ data: { module: r.module, documentId: r.documentId, key: r.key, data: r.data, version, userId: s.uid } });
        await tx.documentVersion.create({ data: { moduleDataId: row.id, version, data: r.data, userId: s.uid } });
      });
      n++;
    }
    await audit(s.uid, "restore", id, { rows: n });
    return NextResponse.json({ ok: true, restored: n });
  } catch (e) { return err(e); }
}
