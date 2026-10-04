"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { allDocs, shortTitle } from "@/lib/docs";
import { Icon } from "./Icons";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => allDocs.map((d) => ({ d, key: norm(`${d.name} ${d.sectionTitle} ${d.group}`) })), []);
  const results = useMemo(() => {
    const t = norm(q).split(/\s+/).filter(Boolean);
    if (!t.length) return [];
    return index.filter((x) => t.every((w) => x.key.includes(w))).slice(0, 30).map((x) => x.d);
  }, [q, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => setSel(0), [q]);

  function go(id: string) { setOpen(false); router.push(`/tai-lieu/${id}`); }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter") { if (results[sel]) go(results[sel].id); else if (q.trim()) { setOpen(false); router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`); } }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-400 transition hover:border-teal-400 hover:bg-white">
        <Icon name="search" className="h-4 w-4" /><span className="flex-1 truncate">Tìm tài liệu, quy trình, biểu mẫu...</span>
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 sm:block">Ctrl K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0b3036]/50 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)} role="dialog" aria-modal="true" aria-label="Tìm kiếm">
          <div className="animate-pop w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4">
              <Icon name="search" className="h-5 w-5 text-teal-700" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown} placeholder="Nhập tên tài liệu (không cần gõ dấu)..." className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400" />
              <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500">Esc</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {!q && <li className="px-3 py-8 text-center text-sm text-slate-400">Gõ để tìm trong {allDocs.length} tài liệu của 2429.2026</li>}
              {q && results.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-400">Không tìm thấy tài liệu phù hợp</li>}
              {q.trim().length > 1 && <li><button onClick={() => { setOpen(false); router.push(`/tim-kiem?q=${encodeURIComponent(q.trim())}`); }} className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-teal-800 hover:bg-teal-50"><Icon name="search" className="h-4 w-4" />Tìm “{q.trim()}” trong nội dung tất cả tài liệu →</button></li>}
              {results.map((d, i) => (
                <li key={d.id}>
                  <button onMouseEnter={() => setSel(i)} onClick={() => go(d.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === sel ? "bg-teal-50" : ""}`}>
                    <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">{d.ext.toUpperCase()}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#12343a]">{d.name.replace(/\.[^.]+$/, "")}</span><span className="block truncate text-xs text-slate-500">{d.section === "chapter" ? `Chương ${d.sectionOrder} · ${shortTitle(d.sectionTitle)}` : d.sectionTitle}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
