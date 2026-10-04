"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSaveStatus } from "@/components/SaveStatus";
import { buildDocx, getFormat, loadDocx, paragraphs, parseXml, pText, serialize, setFormat, setPText, type DocxState, type Fmt } from "@/lib/docxEdit";
import { downloadBlob, MIME_DOCX } from "@/lib/download";
import { VersionPanel } from "./VersionPanel";

const FONTS = ["Times New Roman", "Arial", "Calibri", "Cambria", "Tahoma", "Verdana"];
const SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28];
const btn = "flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-[#12343a] transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-40";

export default function WordEditor({ docId, name, docHref }: { docId: string; name: string; docHref: string }) {
  const { set } = useSaveStatus();
  const st = useRef<DocxState | null>(null);
  const hist = useRef<string[]>([]);
  const hi = useRef(0);
  const baseVersion = useRef(0);
  const dirty = useRef(false);
  const timers = useRef<{ commit?: ReturnType<typeof setTimeout>; render?: ReturnType<typeof setTimeout>; save?: ReturnType<typeof setTimeout> }>({});
  const renderToken = useRef(0);
  const preview = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [texts, setTexts] = useState<string[]>([]);
  const [sel, setSel] = useState(-1);
  const [fmt, setFmt] = useState<Fmt | null>(null);
  const [, bump] = useState(0);
  const [version, setVersion] = useState(0);
  const [showVer, setShowVer] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [find, setFind] = useState("");
  const [repl, setRepl] = useState("");
  const [info, setInfo] = useState("");

  const refresh = useCallback(() => { if (st.current) setTexts(paragraphs(st.current.xml).map(pText)); }, []);

  const renderPreview = useCallback(async () => {
    const s = st.current; const box = preview.current; if (!s || !box) return;
    const token = ++renderToken.current;
    const bytes = await buildDocx(s);
    const { renderAsync } = await import("docx-preview");
    if (token !== renderToken.current) return;
    const tmp = document.createElement("div");
    tmp.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;width:1200px";
    document.body.appendChild(tmp);
    try {
      await renderAsync(new Blob([bytes]), tmp, undefined, { className: "docx", inWrapper: true, breakPages: true, renderHeaders: true, renderFooters: true });
      if (token === renderToken.current) { box.innerHTML = ""; while (tmp.firstChild) box.appendChild(tmp.firstChild); }
    } finally { tmp.remove(); }
  }, []);

  const save = useCallback(async (note?: string) => {
    const s = st.current; if (!s || !dirty.current) return;
    set("saving");
    try {
      const bytes = await buildDocx(s);
      const r = await fetch(`/api/documents/${docId}/edit`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "x-base-version": String(baseVersion.current), ...(note ? { "x-note": note } : {}) }, body: bytes });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { baseVersion.current = j.version; setVersion(j.version); dirty.current = false; set("saved"); }
      else if (r.status === 409) { set("error"); setConflict(true); }
      else { set("error"); setInfo(j.error ?? "Không lưu được. Thử lại."); }
    } catch { set(navigator.onLine ? "error" : "offline"); }
  }, [docId, set]);

  const changed = useCallback(() => {
    dirty.current = true; set("saving");
    clearTimeout(timers.current.commit); clearTimeout(timers.current.render); clearTimeout(timers.current.save);
    timers.current.commit = setTimeout(() => {
      if (!st.current) return;
      const s = serialize(st.current.xml);
      if (s === hist.current[hi.current]) return;
      hist.current = hist.current.slice(0, hi.current + 1); hist.current.push(s);
      if (hist.current.length > 80) hist.current.shift();
      hi.current = hist.current.length - 1; bump((x) => x + 1);
    }, 700);
    timers.current.render = setTimeout(() => { renderPreview(); }, 900);
    timers.current.save = setTimeout(() => { save(); }, 1800);
  }, [renderPreview, save, set]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      let buf: ArrayBuffer;
      const r = await fetch(`/api/documents/${docId}/edit`, { cache: "no-store" });
      if (r.ok) { baseVersion.current = Number(r.headers.get("x-version") ?? 0); buf = await r.arrayBuffer(); }
      else { baseVersion.current = 0; const o = await fetch(`/api/documents/${docId}/file`, { cache: "no-store" }); if (!o.ok) throw new Error("file"); buf = await o.arrayBuffer(); }
      setVersion(baseVersion.current);
      st.current = await loadDocx(buf);
      hist.current = [serialize(st.current.xml)]; hi.current = 0; dirty.current = false; setConflict(false); setSel(-1); setFmt(null);
      refresh(); setState("ready");
      setTimeout(() => { renderPreview(); }, 50);
    } catch {
      setError("Không mở được tài liệu ở chế độ chỉnh sửa. File có thể ở định dạng Word đời cũ (.doc). Bạn vẫn xem được bản gốc ở trang tài liệu.");
      setState("error");
    }
  }, [docId, refresh, renderPreview]);

  useEffect(() => { load(); const t = timers.current; return () => { clearTimeout(t.commit); clearTimeout(t.render); clearTimeout(t.save); }; }, [load]);
  useEffect(() => { const on = () => { if (dirty.current) save(); }; window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, [save]);
  useEffect(() => { const bye = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault(); }; window.addEventListener("beforeunload", bye); return () => window.removeEventListener("beforeunload", bye); }, []);

  const para = (i: number) => (st.current ? paragraphs(st.current.xml)[i] : undefined);
  function edit(i: number, v: string) {
    const p = para(i); if (!p) return;
    const clean = v.replace(/\n/g, " ");
    setPText(p, clean);
    setTexts((t) => { const n = t.slice(); n[i] = clean; return n; });
    changed();
  }
  function selectPara(i: number) { setSel(i); const p = para(i); setFmt(p ? getFormat(p) : null); }
  function format(f: Partial<Fmt>) {
    const p = para(sel); if (!p) { setInfo("Chọn (bấm vào) một đoạn văn bản ở cột bên trái để định dạng."); return; }
    setFormat(p, f); setFmt(getFormat(p)); changed();
  }
  function undoRedo(dir: -1 | 1) {
    const n = hi.current + dir; if (!st.current || n < 0 || n >= hist.current.length) return;
    hi.current = n; st.current.xml = parseXml(hist.current[n]); refresh(); setFmt(null); bump((x) => x + 1);
    dirty.current = true; set("saving"); clearTimeout(timers.current.render); clearTimeout(timers.current.save);
    timers.current.render = setTimeout(() => { renderPreview(); }, 400); timers.current.save = setTimeout(() => { save(); }, 1500);
  }
  function replaceAll() {
    if (!find || !st.current) return;
    let n = 0;
    paragraphs(st.current.xml).forEach((p) => { const t = pText(p); if (t.includes(find)) { n += t.split(find).length - 1; setPText(p, t.split(find).join(repl)); } });
    refresh(); setInfo(n ? `Đã thay ${n} vị trí.` : "Không tìm thấy nội dung cần thay."); if (n) changed();
  }
  function onPreviewClick(e: React.MouseEvent) {
    const p = (e.target as HTMLElement).closest("p"); if (!p || !preview.current) return;
    const text = (p.textContent ?? "").trim(); if (!text) return;
    const same = Array.from(preview.current.querySelectorAll("p")).filter((x) => (x.textContent ?? "").trim() === text);
    const idx = texts.map((t, i) => [t.trim(), i] as const).filter(([t]) => t === text).map(([, i]) => i);
    const target = idx[Math.min(same.indexOf(p), idx.length - 1)];
    if (target === undefined) { setInfo("Đoạn này nằm ở đầu/chân trang hoặc hộp văn bản nên chưa sửa trực tiếp được."); return; }
    selectPara(target); items.current[target]?.focus(); items.current[target]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  async function exportDocx() { if (!st.current) return; downloadBlob(await buildDocx(st.current), name, MIME_DOCX); }
  function printDoc() {
    document.body.classList.add("printing");
    const done = () => { document.body.classList.remove("printing"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); setTimeout(() => window.print(), 50);
  }

  if (state === "loading") return <p className="animate-pulse py-20 text-center text-slate-600">Đang mở trình soạn thảo...</p>;
  if (state === "error") return (<div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center" role="alert"><p className="font-semibold text-[#0f3b40]">Không thể mở trình chỉnh sửa</p><p className="mt-2 text-sm text-slate-600">{error}</p><div className="mt-5 flex justify-center gap-2"><button onClick={load} className="rounded-lg bg-[#0f3b40] px-4 py-2 text-white">↻ TẢI LẠI</button><Link href={docHref} className="rounded-lg border px-4 py-2">Về trang tài liệu</Link></div></div>);

  const canUndo = hi.current > 0, canRedo = hi.current < hist.current.length - 1;
  const visible = texts.map((t, i) => ({ t, i })).filter((x) => !find || x.t.includes(find));
  return (
    <div className="space-y-3">
      <div className="no-print relative flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        <Link href={docHref} className={btn}>← Thoát</Link>
        <span className="mx-1 hidden max-w-[220px] truncate text-sm font-semibold text-[#0f3b40] xl:block" title={name}>{name}</span>
        <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">{version ? `Bản chỉnh sửa v${version}` : "Bản gốc"}</span>
        <i className="mx-1 h-6 w-px bg-slate-200" />
        <button className={btn} onClick={() => undoRedo(-1)} disabled={!canUndo} title="Hoàn tác">↶</button>
        <button className={btn} onClick={() => undoRedo(1)} disabled={!canRedo} title="Làm lại">↷</button>
        <i className="mx-1 h-6 w-px bg-slate-200" />
        <select className={`${btn} w-40 font-normal`} value={fmt?.font ?? ""} onChange={(e) => e.target.value && format({ font: e.target.value })} aria-label="Phông chữ"><option value="">Phông chữ</option>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
        <select className={`${btn} w-20 font-normal`} value={fmt?.size ?? ""} onChange={(e) => e.target.value && format({ size: Number(e.target.value) })} aria-label="Cỡ chữ"><option value="">Cỡ</option>{SIZES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className={`${btn} ${fmt?.bold ? "!bg-teal-100" : ""}`} onClick={() => format({ bold: !fmt?.bold })} title="Đậm"><b>B</b></button>
        <button className={`${btn} ${fmt?.italic ? "!bg-teal-100" : ""}`} onClick={() => format({ italic: !fmt?.italic })} title="Nghiêng"><i>I</i></button>
        <button className={`${btn} ${fmt?.underline ? "!bg-teal-100" : ""}`} onClick={() => format({ underline: !fmt?.underline })} title="Gạch chân"><u>U</u></button>
        {([["left", "⯇", "Căn trái"], ["center", "≡", "Căn giữa"], ["right", "⯈", "Căn phải"], ["both", "☰", "Căn đều"]] as const).map(([v, ic, t]) => (
          <button key={v} className={`${btn} ${fmt?.align === v ? "!bg-teal-100" : ""}`} onClick={() => format({ align: v })} title={t}>{ic}</button>
        ))}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => save("Lưu thủ công")}>Lưu ngay</button>
          <span className="relative"><button className={btn} onClick={() => setShowVer(!showVer)}>Lịch sử</button>{showVer && <VersionPanel docId={docId} current={version} onClose={() => setShowVer(false)} onRestored={() => { setShowVer(false); load(); }} />}</span>
          <button className={btn} onClick={exportDocx}>Xuất Word</button>
          <button className={btn} onClick={printDoc}>In / Xuất PDF</button>
        </span>
      </div>

      {conflict && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">Có người khác vừa lưu phiên bản mới hơn. <button className="font-bold underline" onClick={load}>Tải lại bản mới nhất</button> (các thay đổi chưa lưu của bạn sẽ mất).</p>}
      {info && <p role="status" className="no-print rounded-xl bg-teal-50 px-4 py-2 text-sm text-teal-900">{info} <button className="ml-2 underline" onClick={() => setInfo("")}>Đóng</button></p>}

      <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
        <aside className="no-print flex h-[calc(100vh-15rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="space-y-2 border-b border-slate-100 p-3">
            <div className="flex gap-2"><input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Tìm trong tài liệu" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600" /><input value={repl} onChange={(e) => setRepl(e.target.value)} placeholder="Thay bằng" className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600" /></div>
            <div className="flex items-center justify-between text-xs text-slate-500"><span>{find ? `${visible.length} đoạn khớp` : `${texts.length} đoạn văn bản`}</span><button disabled={!find} onClick={replaceAll} className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-[#0f3b40] hover:bg-teal-50 disabled:opacity-40">Thay tất cả</button></div>
          </div>
          <ul className="flex-1 space-y-1.5 overflow-y-auto p-3">
            {visible.map(({ t, i }) => (
              <li key={i}>
                <textarea ref={(el) => { items.current[i] = el; }} value={t} rows={Math.min(8, Math.max(1, Math.ceil(t.length / 44)))} onFocus={() => selectPara(i)} onChange={(e) => edit(i, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  className={`w-full resize-none rounded-lg border px-2.5 py-1.5 text-[15px] leading-snug outline-none transition ${sel === i ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-600/20" : "border-slate-200 hover:border-slate-300"}`} aria-label={`Đoạn ${i + 1}`} />
              </li>
            ))}
          </ul>
        </aside>
        <section className="min-w-0">
          <p className="no-print mb-2 text-xs text-slate-500">Xem trước đúng bố cục trang in (cập nhật sau khi bạn ngừng gõ). Bấm vào một đoạn trong trang để chuyển tới ô sửa tương ứng. Bản gốc không bị thay đổi.</p>
          <div ref={preview} onClick={onPreviewClick} className="print-area docx-host h-[calc(100vh-17rem)] min-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-200" />
        </section>
      </div>
    </div>
  );
}
