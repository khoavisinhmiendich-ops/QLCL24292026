import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { findDoc } from "@/lib/docs";

export const runtime = "nodejs";
const MIME: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/** ?variant=preview -> bản PDF để xem; ?download=1 -> tải file gốc. Chỉ phục vụ file có trong document-index (chống path traversal). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  let s;
  try { s = await requireRole("read"); } catch (r) { return r as Response; }
  const doc = findDoc(params.id);
  if (!doc) return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
  const u = new URL(req.url);
  const wantPreview = u.searchParams.get("variant") === "preview" && doc.type !== "pdf" && doc.type !== "image";
  const download = u.searchParams.get("download") === "1";
  const rec = await db.document.findUnique({ where: { id: doc.id } }).catch(() => null);
  const remote = wantPreview ? rec?.previewUrl : rec?.blobUrl;
  const outName = wantPreview ? doc.name.replace(/\.[^.]+$/, ".pdf") : doc.name;
  const ext = wantPreview ? "pdf" : doc.ext;
  const headers: Record<string, string> = {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(outName)}`,
    "Cache-Control": "private, max-age=300",
  };
  await audit(s.uid, download ? "download" : "open_document", doc.path);
  if (remote) {
    const r = await fetch(remote);
    if (!r.ok || !r.body) return NextResponse.json({ error: "Không tải được file từ kho lưu trữ" }, { status: 502 });
    return new Response(r.body, { headers });
  }
  // Dev local: đọc từ content/ (không dùng trên Vercel production)
  const root = path.resolve(process.cwd(), wantPreview ? "previews" : "content/2429.2026");
  const rel = wantPreview ? doc.path.replace(/\.[^.]+$/, ".pdf") : doc.path;
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root + path.sep) || !fs.existsSync(abs)) return NextResponse.json({ error: "File chưa có trên máy chủ" }, { status: 404 });
  return new Response(fs.readFileSync(abs), { headers });
}
