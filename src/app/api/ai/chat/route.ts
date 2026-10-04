import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { search, snippet, sectionLabel } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) })).min(1).max(12),
  internet: z.boolean().default(false),
});

const SYSTEM = `Bạn là AI Assistant 2429.2026 của Khoa Vi sinh – Miễn dịch, hỗ trợ tra cứu hệ thống hồ sơ quản lý chất lượng theo QĐ-2429/BYT.
Quy tắc bắt buộc:
1. Với câu hỏi về tài liệu nội bộ, chỉ dùng phần NGỮ CẢNH TÀI LIỆU 2429.2026 bên dưới. Không bịa nội dung tài liệu. Mỗi ý lấy từ tài liệu phải kèm số trích dẫn dạng [1], [2] đúng với số thứ tự đoạn trong ngữ cảnh.
2. Nếu ngữ cảnh không đủ để trả lời, nói rõ: "Không tìm thấy nội dung này trong tài liệu 2429.2026".
3. Chỉ dùng công cụ web_search (nếu có) khi câu hỏi cần thông tin bên ngoài tài liệu hoặc quy định mới nhất.
4. Luôn tách bạch nguồn. Khi dùng cả hai nguồn, trình bày hai mục riêng: "Thông tin từ tài liệu 2429.2026:" và "Thông tin tra cứu Internet:" (nêu rõ tên nguồn). Không trộn thông tin Internet vào phần tài liệu nội bộ.
5. Trả lời bằng tiếng Việt, ngắn gọn, chính xác, dùng gạch đầu dòng khi liệt kê.`;

type Block = { type: string; text?: string; content?: unknown };

export async function POST(req: Request) {
  let s;
  try { assertSameOrigin(); s = await requireRole("read"); } catch (r) { return r as Response; }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  const { messages, internet } = parsed.data;
  if (messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Tin nhắn cuối phải là của người dùng" }, { status: 400 });

  const recent = await db.auditLog.count({ where: { userId: s.uid, action: "ai_chat", createdAt: { gte: new Date(Date.now() - 60_000) } } }).catch(() => 0);
  if (recent >= 10) return NextResponse.json({ error: "Bạn hỏi quá nhanh. Vui lòng thử lại sau ít phút." }, { status: 429 });

  const users = messages.filter((m) => m.role === "user");
  const last = users[users.length - 1].content;
  const query = last.length < 40 && users.length > 1 ? `${users[users.length - 2].content} ${last}` : last;
  const hits = search(query, 8, 2);
  const sources = hits.map((h, i) => ({ n: i + 1, id: h.doc.id, name: h.doc.name, where: sectionLabel(h.doc), page: h.page, snippet: snippet(h.text, query) }));
  await audit(s.uid, "ai_chat", last.slice(0, 80), { internet, hits: hits.length });

  const key = process.env.AI_API_KEY;
  if (!key) {
    const body = sources.length
      ? "AI chưa được cấu hình (thiếu AI_API_KEY) nên tôi chỉ liệt kê các đoạn liên quan nhất trong tài liệu 2429.2026:\n\n" + sources.slice(0, 4).map((x) => `[${x.n}] ${x.snippet}`).join("\n\n")
      : "AI chưa được cấu hình (thiếu AI_API_KEY) và không tìm thấy đoạn nào phù hợp trong tài liệu 2429.2026.";
    return NextResponse.json({ answer: body, sources, web: [], mode: "extractive" });
  }

  const context = hits.length
    ? hits.map((h, i) => `[${i + 1}] File: ${h.doc.name} | ${sectionLabel(h.doc)} | Trang ${h.page}\n${h.text}`).join("\n\n")
    : "(Không tìm thấy đoạn nào phù hợp trong tài liệu 2429.2026)";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-sonnet-5-5",
        max_tokens: 1500,
        system: `${SYSTEM}\n\nNGỮ CẢNH TÀI LIỆU 2429.2026:\n${context}`,
        messages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        ...(internet ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }] } : {}),
      }),
    });
    const j = (await r.json()) as { content?: Block[]; error?: { message?: string } };
    if (!r.ok) { console.error("AI error", j.error); return NextResponse.json({ error: "Dịch vụ AI đang lỗi hoặc cấu hình sai. Vui lòng thử lại." }, { status: 502 }); }
    const blocks = j.content ?? [];
    const answer = blocks.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
    const web: { title: string; url: string }[] = [];
    for (const b of blocks) if (b.type === "web_search_tool_result" && Array.isArray(b.content))
      for (const x of b.content as { type?: string; title?: string; url?: string }[]) if (x.url && !web.some((w) => w.url === x.url)) web.push({ title: x.title ?? x.url, url: x.url });
    return NextResponse.json({ answer: answer || "Không có phản hồi.", sources, web, mode: "ai" });
  } catch (e) {
    console.error("AI fetch failed", e);
    return NextResponse.json({ error: "Không kết nối được dịch vụ AI." }, { status: 502 });
  }
}
