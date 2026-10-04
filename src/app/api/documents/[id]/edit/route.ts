import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { findDoc } from "@/lib/docs";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BYTES = 4_000_000; // giới hạn body của Vercel ~4,5 MB
const KEEP = 30;
const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const err = (r: unknown) => (r instanceof Response ? r : NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 }));
const bad = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s });

function editable(id: string) {
  const d = findDoc(id);
  return d && (d.ext === "docx" || d.ext === "xlsx") ? d : null;
}

/** GET ?versions=1 -> danh sách phiên bản; GET ?v=N -> file phiên bản N; GET -> file phiên bản mới nhất (404 nếu chưa có bản chỉnh sửa). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("read");
    const d = editable(params.id);
    if (!d) return bad("Tài liệu không hỗ trợ chỉnh sửa", 404);
    const u = new URL(req.url);
    if (u.searchParams.get("versions")) {
      const list = await db.docFile.findMany({ where: { documentId: d.id }, select: { version: true, size: true, note: true, userId: true, createdAt: true }, orderBy: { version: "desc" } });
      const users = await db.user.findMany({ where: { id: { in: Array.from(new Set(list.map((x) => x.userId))) } }, select: { id: true, username: true } });
      const name = new Map(users.map((x) => [x.id, x.username]));
      return NextResponse.json({ versions: list.map((x) => ({ version: x.version, size: x.size, note: x.note, createdAt: x.createdAt, user: name.get(x.userId) ?? "-" })) });
    }
    const v = Number(u.searchParams.get("v"));
    const row = v ? await db.docFile.findUnique({ where: { documentId_version: { documentId: d.id, version: v } } }) : await db.docFile.findFirst({ where: { documentId: d.id }, orderBy: { version: "desc" } });
    if (!row) return bad("Chưa có bản chỉnh sửa", 404);
    return new Response(new Uint8Array(row.bytes), { headers: { "Content-Type": MIME[d.ext], "x-version": String(row.version), "Cache-Control": "no-store" } });
  } catch (e) { return err(e); }
}

/** Lưu phiên bản mới (tự lưu). Header x-base-version = phiên bản đang sửa dở, dùng để phát hiện xung đột. */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin();
    const s = await requireRole("write");
    const d = editable(params.id);
    if (!d) return bad("Tài liệu không hỗ trợ chỉnh sửa", 404);
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length < 100) return bad("Dữ liệu không hợp lệ");
    if (buf.length > MAX_BYTES) return bad("File quá lớn để lưu trực tuyến (tối đa 4 MB). Hãy dùng Xuất file để lưu về máy.", 413);
    if (buf[0] !== 0x50 || buf[1] !== 0x4b) return bad("File không đúng định dạng Office");
    const base = Number(req.headers.get("x-base-version") ?? 0);
    const note = (req.headers.get("x-note") ?? "").slice(0, 120) || null;
    const out = await db.$transaction(async (tx) => {
      const cur = await tx.docFile.findFirst({ where: { documentId: d.id }, orderBy: { version: "desc" }, select: { version: true } });
      if ((cur?.version ?? 0) !== base) return { conflict: true as const, version: cur?.version ?? 0 };
      const version = (cur?.version ?? 0) + 1;
      await tx.docFile.create({ data: { documentId: d.id, version, size: buf.length, note, bytes: buf, userId: s.uid } });
      await tx.docFile.deleteMany({ where: { documentId: d.id, version: { lte: version - KEEP } } });
      return { conflict: false as const, version };
    });
    if (out.conflict) return NextResponse.json({ error: "Có người khác vừa lưu phiên bản mới hơn", version: out.version }, { status: 409 });
    await audit(s.uid, "doc_edit_save", d.path, { version: out.version, size: buf.length });
    return NextResponse.json({ ok: true, version: out.version });
  } catch (e) { return err(e); }
}

/** Khôi phục: tạo phiên bản mới có nội dung của phiên bản cũ (không xóa lịch sử). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin();
    const s = await requireRole("write");
    const d = editable(params.id);
    if (!d) return bad("Tài liệu không hỗ trợ chỉnh sửa", 404);
    const { restore } = z.object({ restore: z.number().int().positive() }).parse(await req.json());
    const old = await db.docFile.findUnique({ where: { documentId_version: { documentId: d.id, version: restore } } });
    if (!old) return bad("Không tìm thấy phiên bản", 404);
    const cur = await db.docFile.findFirst({ where: { documentId: d.id }, orderBy: { version: "desc" }, select: { version: true } });
    const version = (cur?.version ?? 0) + 1;
    await db.docFile.create({ data: { documentId: d.id, version, size: old.size, note: `Khôi phục từ v${restore}`, bytes: old.bytes, userId: s.uid } });
    await audit(s.uid, "doc_edit_restore", d.path, { from: restore, to: version });
    return NextResponse.json({ ok: true, version });
  } catch (e) { return err(e); }
}
