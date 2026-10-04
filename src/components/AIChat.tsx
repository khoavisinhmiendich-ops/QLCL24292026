"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "./Icons";

type Source = { n: number; id: string; name: string; where: string; page: number; snippet: string };
type Web = { title: string; url: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[]; web?: Web[]; error?: boolean };
const KEY = "qlcl_ai_chat";
const SUGGEST = ["Quy trình kiểm soát tài liệu gồm những bước nào?", "Chính sách chất lượng của khoa là gì?", "Biểu mẫu nào dùng để hủy tài liệu?"];

function Answer({ m }: { m: Msg }) {
  const parts = m.content.split(/(\[\d+\])/g);
  const cited = new Set(Array.from(m.content.matchAll(/\[(\d+)\]/g)).map((x) => Number(x[1])));
  const shown = (m.sources ?? []).filter((s) => cited.has(s.n));
  const list = shown.length ? shown : [];
  return (
    <div>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
        {parts.map((p, i) => {
          const n = /^\[(\d+)\]$/.exec(p)?.[1];
          const src = n ? m.sources?.find((s) => s.n === Number(n)) : undefined;
          return src ? <Link key={i} href={`/tai-lieu/${src.id}`} title={`${src.name} · trang ${src.page}`} className="mx-0.5 rounded bg-teal-100 px-1 text-xs font-bold text-teal-800 hover:bg-teal-200">{p}</Link> : <span key={i}>{p}</span>;
        })}
      </p>
      {list.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/70 p-2.5 text-xs">
          <p className="mb-1 font-bold uppercase tracking-wide text-teal-800">Thông tin từ tài liệu 2429.2026</p>
          <ul className="space-y-1">{list.map((s) => (
            <li key={s.n}><Link href={`/tai-lieu/${s.id}`} className="font-semibold text-[#0f3b40] hover:underline">[{s.n}] {s.name.replace(/\.[^.]+$/, "")}</Link><span className="text-slate-500"> · {s.where} · trang {s.page}</span></li>
          ))}</ul>
        </div>
      )}
      {m.web && m.web.length > 0 && (
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs">
          <p className="mb-1 font-bold uppercase tracking-wide text-amber-800">Thông tin tra cứu Internet</p>
          <ul className="space-y-1">{m.web.map((w) => <li key={w.url}><a href={w.url} target="_blank" rel="noreferrer" className="text-amber-900 underline">{w.title}</a></li>)}</ul>
        </div>
      )}
    </div>
  );
}

export function AIChat() {
  const [open, setOpen] = useState(false);
  const [big, setBig] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [internet, setInternet] = useState(false);
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v) setMsgs(JSON.parse(v) as Msg[]); } catch { /* bỏ qua */ } }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch { /* bỏ qua */ } end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, open]);

  async function ask(history: Msg[]) {
    setBusy(true);
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })), internet }) });
      const j = await r.json();
      setMsgs([...history, r.ok ? { role: "assistant", content: j.answer, sources: j.sources, web: j.web } : { role: "assistant", content: j.error ?? "Có lỗi xảy ra. Vui lòng thử lại.", error: true }]);
    } catch { setMsgs([...history, { role: "assistant", content: "Không kết nối được máy chủ. Vui lòng thử lại.", error: true }]); }
    finally { setBusy(false); }
  }
  function send(text: string) { const t = text.trim(); if (!t || busy) return; setInput(""); ask([...msgs, { role: "user", content: t }]); }
  function regenerate() { const i = msgs.map((m) => m.role).lastIndexOf("user"); if (i >= 0 && !busy) ask(msgs.slice(0, i + 1)); }
  function clear() { if (confirm("Xóa toàn bộ cuộc trò chuyện?")) setMsgs([]); }

  return (
    <div className="no-print">
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Mở trợ lý AI" className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-teal-600 to-[#0f3b40] px-5 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
          <Icon name="bot" className="h-6 w-6" /><span className="font-semibold">Trợ lý AI</span>
        </button>
      )}
      {open && (
        <section className={`animate-pop fixed bottom-6 right-6 z-40 flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${big ? "h-[85vh] w-[min(760px,calc(100vw-3rem))]" : "h-[600px] w-[min(420px,calc(100vw-3rem))]"}`} aria-label="Trợ lý AI 2429.2026">
          <header className="flex items-center gap-3 bg-[#0b3036] px-4 py-3 text-white">
            <Icon name="bot" className="h-6 w-6 text-teal-300" />
            <div className="min-w-0 flex-1 leading-tight"><p className="text-[15px] font-bold">AI Assistant 2429.2026</p><p className="text-xs text-teal-200">Tra cứu tài liệu nội bộ &amp; Internet</p></div>
            <button onClick={() => setBig(!big)} className="rounded px-2 py-1 text-sm hover:bg-white/10" title={big ? "Thu nhỏ" : "Mở rộng"}>{big ? "⤡" : "⤢"}</button>
            <button onClick={clear} className="rounded px-2 py-1 text-xs hover:bg-white/10" title="Xóa cuộc trò chuyện">Xóa</button>
            <button onClick={() => setOpen(false)} className="rounded px-2 py-1 text-lg leading-none hover:bg-white/10" aria-label="Thu nhỏ trợ lý">–</button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f4f8f7] p-4">
            {msgs.length === 0 && (
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-[#0f3b40]">Xin chào! Tôi có thể trả lời dựa trên toàn bộ tài liệu 2429.2026.</p>
                <ul className="mt-3 space-y-2">{SUGGEST.map((q) => <li key={q}><button onClick={() => send(q)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-teal-400 hover:bg-teal-50">{q}</button></li>)}</ul>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 ${m.role === "user" ? "bg-[#0f3b40] text-white" : m.error ? "bg-red-50 text-red-800" : "bg-teal-50 text-[#12343a]"}`}>
                  {m.role === "user" ? <p className="whitespace-pre-wrap text-[15px]">{m.content}</p> : <Answer m={m} />}
                  {m.role === "assistant" && !m.error && (
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <button onClick={() => navigator.clipboard?.writeText(m.content)} className="hover:text-teal-700">Sao chép</button>
                      {i === msgs.length - 1 && <button onClick={regenerate} className="hover:text-teal-700">Tạo lại</button>}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="animate-pulse text-sm text-slate-500">Đang tra cứu...</p>}
            <div ref={end} />
          </div>
          <footer className="border-t border-slate-200 bg-white p-3">
            <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={internet} onChange={(e) => setInternet(e.target.checked)} />Cho phép tra cứu Internet khi cần</label>
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} rows={2} maxLength={2000} placeholder="Nhập câu hỏi... (Enter để gửi)" className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-[15px] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" />
              <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Gửi" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f3b40] text-white transition hover:bg-teal-700 disabled:opacity-40"><Icon name="send" className="h-5 w-5" /></button>
            </div>
          </footer>
        </section>
      )}
    </div>
  );
}
