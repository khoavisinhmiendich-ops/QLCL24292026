import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { search, snippet, sectionLabel } from "@/lib/rag";

export async function GET(req: Request) {
  try { await requireRole("read"); } catch (r) { return r as Response; }
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 200).trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const results = search(q, 20, 1).map((h) => ({ id: h.doc.id, name: h.doc.name, where: sectionLabel(h.doc), page: h.page, snippet: snippet(h.text, q) }));
  return NextResponse.json({ results });
}
