import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const err = (r: unknown) => (r instanceof Response ? r : NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 }));

// Lịch sử phiên bản
export async function GET(req: Request) {
  try {
    await requireRole("read");
    const id = new URL(req.url).searchParams.get("id") ?? "";
    const list = await db.documentVersion.findMany({ where: { moduleDataId: id }, orderBy: { version: "desc" }, take: 100 });
    return NextResponse.json({ versions: list });
  } catch (e) { return err(e); }
}
// Khôi phục = tạo version mới có nội dung của version cũ (không xóa lịch sử)
export async function POST(req: Request) {
  try {
    assertSameOrigin();
    const s = await requireRole("write");
    const { id, version } = z.object({ id: z.string(), version: z.number().int() }).parse(await req.json());
    const old = await db.documentVersion.findUnique({ where: { moduleDataId_version: { moduleDataId: id, version } } });
    if (!old) return NextResponse.json({ error: "Không tìm thấy phiên bản" }, { status: 404 });
    const out = await db.$transaction(async (tx) => {
      const cur = await tx.moduleData.findUniqueOrThrow({ where: { id } });
      const next = cur.version + 1;
      await tx.moduleData.update({ where: { id }, data: { data: old.data as object, version: next, userId: s.uid } });
      await tx.documentVersion.create({ data: { moduleDataId: id, version: next, data: old.data as object, userId: s.uid } });
      return next;
    });
    await audit(s.uid, "data_restore", id, { from: version, to: out });
    return NextResponse.json({ ok: true, version: out });
  } catch (e) { return err(e); }
}
