import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { findDoc } from "@/lib/docs";

const Key = z.object({ module: z.string().min(1).max(80), documentId: z.string().max(40).nullable().optional(), key: z.string().max(80).default("main") });
const Put = Key.extend({ data: z.unknown(), baseVersion: z.number().int().min(0).default(0) });
const err = (r: unknown) => (r instanceof Response ? r : NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 }));

export async function GET(req: Request) {
  try {
    await requireRole("read");
    const u = new URL(req.url);
    const q = Key.parse({ module: u.searchParams.get("module"), documentId: u.searchParams.get("documentId"), key: u.searchParams.get("key") ?? "main" });
    const row = await db.moduleData.findFirst({ where: { module: q.module, documentId: q.documentId ?? null, key: q.key } });
    return NextResponse.json({ data: row?.data ?? null, version: row?.version ?? 0, updatedAt: row?.updatedAt ?? null });
  } catch (e) { return err(e); }
}

/** Autosave: ghi dữ liệu + tạo version mới; phát hiện xung đột bằng baseVersion. */
export async function PUT(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("write");
    const b = Put.parse(await req.json());
    if (b.documentId && !findDoc(b.documentId)) return NextResponse.json({ error: "Tài liệu không tồn tại" }, { status: 404 });
    if (JSON.stringify(b.data ?? null).length > 2_000_000) return NextResponse.json({ error: "Dữ liệu quá lớn" }, { status: 413 });
    const documentId = b.documentId ?? null;
    const result = await db.$transaction(async (tx) => {
      const cur = await tx.moduleData.findFirst({ where: { module: b.module, documentId, key: b.key } });
      if (cur && cur.version !== b.baseVersion) return { conflict: true as const, version: cur.version, data: cur.data };
      const version = (cur?.version ?? 0) + 1;
      const row = cur
        ? await tx.moduleData.update({ where: { id: cur.id }, data: { data: b.data as object, version, userId: s.uid } })
        : await tx.moduleData.create({ data: { module: b.module, documentId, key: b.key, data: b.data as object, version, userId: s.uid } });
      await tx.documentVersion.create({ data: { moduleDataId: row.id, version, data: b.data as object, userId: s.uid } });
      return { conflict: false as const, version, updatedAt: row.updatedAt };
    });
    if (result.conflict) return NextResponse.json({ error: "Dữ liệu đã được người khác cập nhật", ...result }, { status: 409 });
    await audit(s.uid, "data_save", `${b.module}:${documentId ?? "-"}:${b.key}`, { version: result.version });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) { return err(e); }
}

export async function DELETE(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("manage");
    const u = new URL(req.url);
    const q = Key.parse({ module: u.searchParams.get("module"), documentId: u.searchParams.get("documentId"), key: u.searchParams.get("key") ?? "main" });
    await db.moduleData.deleteMany({ where: { module: q.module, documentId: q.documentId ?? null, key: q.key } });
    await audit(s.uid, "data_delete", `${q.module}:${q.documentId ?? "-"}:${q.key}`);
    return NextResponse.json({ ok: true });
  } catch (e) { return err(e); }
}
