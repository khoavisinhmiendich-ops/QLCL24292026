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
async function handle(req: Request, id: string, headOnly: boolean) {
  let s;
  try { s = await requireRole("read"); } catch (r) { return r as Response; }
  const doc = findDoc(id);
  if (!doc) return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
  const u = new URL(req.url);
  const wantPreview = u.searchParams.get("variant") === "preview" && doc.type !== "pdf" && doc.type !== "image";
  const download = u.searchParams.get("download") === "1";
  const outName = wantPreview ? `${doc.name}.pdf` : doc.name;
  const ext = wantPreview ? "pdf" : doc.ext;
  const headers: Record<string, string> = {
    "Content-Type": MIME[ext] ?? "application/octet-stream",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(outName)}`,
    "Cache-Control": "private, max-age=300",
  };
  const finish = async (body: BodyInit | null) => {
    if (!headOnly) await audit(s.uid, download ? "download" : "open_document", doc.path);
    return new Response(headOnly ? null : body, { headers });
  };

  // 1) Chạy cục bộ (không phải Vercel): đọc thẳng từ thư mục content/ hoặc previews/
  if (!process.env.VERCEL) {
    const root = path.resolve(process.cwd(), wantPreview ? "previews" : "content/2429.2026");
    const rel = wantPreview ? `${doc.path}.pdf` : doc.path;
    const abs = path.resolve(root, rel);
    if (abs.startsWith(root + path.sep) && fs.existsSync(abs)) return finish(fs.readFileSync(abs));
  }
  // 2) Production: lấy từ kho lưu trữ (Vercel Blob) theo metadata trong database
  const rec = await db.document.findUnique({ where: { id: doc.id } }).catch(() => null);
  const remote = wantPreview ? rec?.previewUrl : rec?.blobUrl;
  if (remote) {
    const r = await fetch(remote);
    if (!r.ok || !r.body) return NextResponse.json({ error: "Không tải được file từ kho lưu trữ" }, { status: 502 });
    return finish(r.body);
  }
  return NextResponse.json({ error: "File chưa có trên máy chủ" }, { status: 404 });
}

export async function GET(req: Request, { params }: { params: { id: string } }) { return handle(req, params.id, false); }
export async function HEAD(req: Request, { params }: { params: { id: string } }) { return handle(req, params.id, true); }
