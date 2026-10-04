"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Cell, CellValue, Workbook, Worksheet } from "exceljs";
import { useSaveStatus } from "@/components/SaveStatus";
import { colName, evalFormula } from "@/lib/formula";
import { downloadBlob, MIME_XLSX } from "@/lib/download";
import { VersionPanel } from "./VersionPanel";

const HDR_W = 48, HDR_H = 26, DEF_H = 20;
type Sel = { ar: number; ac: number; r1: number; c1: number; r2: number; c2: number };
type Snap = { v: CellValue; s: unknown };
type Change = { sheet: number; r: number; c: number; before: Snap; after: Snap };
type Rect = { r1: number; c1: number; r2: number; c2: number };
const btn = "flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-[#12343a] transition hover:border-teal-400 hover:bg-teal-50 disabled:opacity-40";
const argb = (c?: { argb?: string } | null) => (c?.argb && c.argb.length === 8 ? "#" + c.argb.slice(2) : undefined);
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").toLowerCase();
const isFormula = (v: CellValue) => typeof v === "object" && v !== null && !(v instanceof Date) && "formula" in v;
const fc = (w: Worksheet | undefined, r: number, c: number) => (w as unknown as { findCell(r: number, c: number): Cell | undefined } | undefined)?.findCell(r, c);
const fr = (w: Worksheet | undefined, r: number) => (w as unknown as { findRow(r: number): { height?: number; hidden?: boolean } | undefined } | undefined)?.findRow(r);
const bsearch = (arr: number[], v: number) => { let lo = 1, hi = arr.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (arr[m] <= v) lo = m; else hi = m - 1; } return lo; };

function plain(v: CellValue): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && !(v instanceof Date)) {
    const o = v as unknown as Record<string, unknown>;
    if ("richText" in o) return (o.richText as { text: string }[]).map((x) => x.text).join("");
    if ("formula" in o || "sharedFormula" in o) return o.result ?? null;
    if ("hyperlink" in o) return o.text ?? o.hyperlink;
    if ("error" in o) return String(o.error);
    return null;
  }
  return v;
}
function fmtNum(n: number, f?: string) {
  if (!f || f === "General") return Number.isInteger(n) ? String(n) : String(Math.round(n * 1e10) / 1e10);
  if (/[dmy]/i.test(f.replace(/\[.*?\]|"[^"]*"/g, "")) && !/[0#]/.test(f)) { const d = new Date(Math.round((n - 25569) * 86400000)); return Number.isNaN(d.getTime()) ? String(n) : d.toLocaleDateString("vi-VN", { timeZone: "UTC" }); }
  const dec = (/\.(0+)/.exec(f)?.[1] ?? "").length;
  if (f.includes("%")) return (n * 100).toFixed(dec) + "%";
  return n.toLocaleString("vi-VN", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: f.includes(",") });
}
function fmtValue(p: unknown, numFmt?: string): string {
  if (p === null || p === undefined) return "";
  if (typeof p === "number") return fmtNum(p, numFmt);
  if (typeof p === "boolean") return p ? "TRUE" : "FALSE";
  if (p instanceof Date) return p.toLocaleDateString("vi-VN", { timeZone: "UTC" });
  return String(p);
}
function editText(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (isFormula(v)) return "=" + (v as unknown as { formula?: string }).formula;
  if (typeof v === "object" && !(v instanceof Date) && "sharedFormula" in (v as object)) { const r = plain(v); return r === null ? "" : String(r); }
  const p = plain(v);
  if (p instanceof Date) return p.toLocaleDateString("vi-VN", { timeZone: "UTC" });
  return p === null ? "" : String(p);
}
function parseInput(t: string): CellValue {
  if (t === "") return null;
  if (t.startsWith("=") && t.length > 1) return { formula: t.slice(1) } as unknown as CellValue;
  const s = t.trim();
  if (/^-?(0|[1-9]\d*)([.,]\d+)?$/.test(s)) return Number(s.replace(",", "."));
  return t;
}

type Look = { bold?: boolean; italic?: boolean; underline?: boolean; size?: number; color?: string; family?: string; bg?: string; h?: string; v?: string; wrap?: boolean; b: { t?: string; r?: string; b?: string; l?: string } };
function look(cell?: Cell): Look {
  const o: Look = { b: {} };
  if (!cell) return o;
  const f = cell.font; const fl = cell.fill as unknown as { type?: string; pattern?: string; fgColor?: { argb?: string } } | undefined; const al = cell.alignment; const bd = cell.border;
  if (f) { o.bold = !!f.bold; o.italic = !!f.italic; o.underline = !!f.underline; o.size = f.size; o.color = argb(f.color as { argb?: string }); o.family = f.name; }
  if (fl && fl.type === "pattern" && fl.pattern === "solid") o.bg = argb(fl.fgColor);
  if (al) { o.h = al.horizontal as string | undefined; o.v = al.vertical as string | undefined; o.wrap = !!al.wrapText; }
  if (bd) { (["top", "right", "bottom", "left"] as const).forEach((k) => { const e = bd[k]; if (e?.style) o.b[k[0] as "t" | "r" | "b" | "l"] = `${e.style === "medium" || e.style === "thick" ? 2 : 1}px solid ${argb(e.color as { argb?: string }) ?? "#222"}`; }); }
  return o;
}
function gridStyle(l: Look, numeric: boolean): React.CSSProperties {
  const h = l.h === "center" || l.h === "centerContinuous" ? "center" : l.h === "right" || (!l.h && numeric) ? "flex-end" : "flex-start";
  return {
    display: "flex", alignItems: l.v === "top" ? "flex-start" : l.v === "middle" || l.v === "center" ? "center" : "flex-end", justifyContent: h,
    textAlign: h === "center" ? "center" : h === "flex-end" ? "right" : "left", whiteSpace: l.wrap ? "pre-wrap" : "nowrap", wordBreak: l.wrap ? "break-word" : undefined,
    fontWeight: l.bold ? 700 : undefined, fontStyle: l.italic ? "italic" : undefined, textDecoration: l.underline ? "underline" : undefined,
    fontSize: l.size ? `${Math.round(l.size * 1.333)}px` : undefined, color: l.color, background: l.bg, fontFamily: l.family ? `"${l.family}", "Times New Roman", serif` : undefined,
    borderTop: l.b.t, borderRight: l.b.r, borderBottom: l.b.b, borderLeft: l.b.l,
  };
}
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function ExcelEditor({ docId, name, docHref }: { docId: string; name: string; docHref: string }) {
  const { set } = useSaveStatus();
  const wbRef = useRef<Workbook | null>(null);
  const exRef = useRef<typeof import("exceljs") | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const fileIn = useRef<HTMLInputElement>(null);
  const baseVersion = useRef(0);
  const dirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const undo = useRef<Change[][]>([]);
  const redo = useRef<Change[][]>([]);
  const drag = useRef<null | { kind: "sel" } | { kind: "col"; c: number; x0: number; w0: number }>(null);
  const [rev, force] = useReducer((x: number) => x + 1, 0);
  const editRef = useRef<null | { text: string; src: "cell" | "bar" }>(null);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [sheetIdx, setSheetIdx] = useState(0);
  const [sel, setSel] = useState<Sel>({ ar: 1, ac: 1, r1: 1, c1: 1, r2: 1, c2: 1 });
  const [editing, setEditing] = useState<null | { text: string; src: "cell" | "bar" }>(null);
  const [scroll, setScroll] = useState({ top: 0, left: 0, w: 900, h: 500 });
  const [frozen, setFrozen] = useState<Record<number, { rows: number; cols: number }>>({});
  const [filter, setFilter] = useState<null | { col: number; text: string; header: number }>(null);
  const [version, setVersion] = useState(0);
  const [showVer, setShowVer] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [info, setInfo] = useState("");
  const [orient, setOrient] = useState<"portrait" | "landscape">("landscape");

  const ws = (): Worksheet | undefined => wbRef.current?.worksheets[sheetIdx];

  /* ---------- lưu / tải ---------- */
  const save = useCallback(async (note?: string) => {
    const wb = wbRef.current; if (!wb || !dirty.current) return;
    set("saving");
    try {
      wb.calcProperties.fullCalcOnLoad = true;
      const buf = (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer;
      const r = await fetch(`/api/documents/${docId}/edit`, { method: "PUT", headers: { "Content-Type": "application/octet-stream", "x-base-version": String(baseVersion.current), ...(note ? { "x-note": note } : {}) }, body: new Uint8Array(buf) });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { baseVersion.current = j.version; setVersion(j.version); dirty.current = false; set("saved"); }
      else if (r.status === 409) { set("error"); setConflict(true); }
      else { set("error"); setInfo(j.error ?? "Không lưu được. Thử lại."); }
    } catch { set(navigator.onLine ? "error" : "offline"); }
  }, [docId, set]);
  const markDirty = useCallback(() => { dirty.current = true; set("saving"); clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { save(); }, 1800); force(); }, [save, set]);

  const loadBuffer = useCallback(async (buf: ArrayBuffer) => {
    if (!exRef.current) { const m = await import("exceljs"); exRef.current = ((m as unknown as { default?: typeof m }).default ?? m) as typeof m; }
    const wb = new exRef.current.Workbook();
    await wb.xlsx.load(buf as unknown as Parameters<typeof wb.xlsx.load>[0]);
    if (!wb.worksheets.length) throw new Error("empty");
    wbRef.current = wb; undo.current = []; redo.current = []; setSheetIdx(0); setSel({ ar: 1, ac: 1, r1: 1, c1: 1, r2: 1, c2: 1 }); setFilter(null); setEditing(null);
  }, []);

  const load = useCallback(async () => {
    setState("loading");
    try {
      let buf: ArrayBuffer;
      const r = await fetch(`/api/documents/${docId}/edit`, { cache: "no-store" });
      if (r.ok) { baseVersion.current = Number(r.headers.get("x-version") ?? 0); buf = await r.arrayBuffer(); }
      else { baseVersion.current = 0; const o = await fetch(`/api/documents/${docId}/file`, { cache: "no-store" }); if (!o.ok) throw new Error("file"); buf = await o.arrayBuffer(); }
      setVersion(baseVersion.current); dirty.current = false; setConflict(false);
      await loadBuffer(buf); setState("ready");
    } catch {
      setError("Không mở được bảng tính ở chế độ chỉnh sửa. File có thể ở định dạng Excel đời cũ (.xls). Bạn vẫn xem được bản gốc ở trang tài liệu.");
      setState("error");
    }
  }, [docId, loadBuffer]);

  useEffect(() => { load(); return () => clearTimeout(saveTimer.current); }, [load]);
  useEffect(() => { const on = () => { if (dirty.current) save(); }; window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, [save]);
  useEffect(() => { const bye = (e: BeforeUnloadEvent) => { if (dirty.current) e.preventDefault(); }; window.addEventListener("beforeunload", bye); return () => window.removeEventListener("beforeunload", bye); }, []);
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const measure = () => setScroll((s) => ({ ...s, w: el.clientWidth, h: el.clientHeight }));
    measure(); const ro = new ResizeObserver(measure); ro.observe(el); return () => ro.disconnect();
  }, [state]);

  /* ---------- hình học lưới ---------- */
  const sheet = ws();
  editRef.current = editing;
  const geo = useMemo(() => {
    if (!sheet) return null;
    const nCols = Math.min(200, Math.max(sheet.columnCount, 10) + 2), nRows = Math.min(5000, Math.max(sheet.rowCount, 40) + 30);
    const X = [0, 0], Y = [0, 0];
    for (let c = 1; c <= nCols; c++) { const col = sheet.getColumn(c); X.push(X[c] + (col.hidden ? 0 : Math.round((col.width ?? 8.43) * 7 + 5))); }
    const hidden = new Set<number>();
    if (filter) {
      for (let r = filter.header + 1; r <= sheet.rowCount; r++) {
        const cell = fc(sheet, r, filter.col); const t = cell ? fmtValue(plain(cell.value), cell.numFmt) : "";
        if (filter.text && !norm(t).includes(norm(filter.text))) hidden.add(r);
      }
    }
    for (let r = 1; r <= nRows; r++) { const row = fr(sheet, r); Y.push(Y[r] + (hidden.has(r) || row?.hidden ? 0 : Math.max(12, Math.round((row?.height ?? 15) * 1.333)))); }
    const merges = ((sheet.model as unknown as { merges?: string[] }).merges ?? []).map((a) => {
      const m = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(a); if (!m) return null;
      const ci = (s: string) => s.split("").reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
      return { r1: Number(m[2]), c1: ci(m[1]), r2: Number(m[4]), c2: ci(m[3]) } as Rect;
    }).filter((x): x is Rect => !!x);
    const master = new Map<string, Rect>(); const slave = new Set<string>();
    merges.forEach((m) => { for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) { if (r === m.r1 && c === m.c1) master.set(`${r},${c}`, m); else slave.add(`${r},${c}`); } });
    return { nCols, nRows, X, Y, merges, master, slave };
  }, [sheet, filter, rev, sheetIdx]);
  const fz = frozen[sheetIdx] ?? { rows: 0, cols: 0 };

  /* ---------- giá trị hiển thị (có tính công thức khi đã sửa) ---------- */
  const evalMemo = new Map<string, unknown>();
  const touched = undo.current.length > 0 || redo.current.length > 0 || dirty.current;
  function raw(r: number, c: number, depth = 0): unknown {
    const cell = fc(sheet, r, c); if (!cell) return null;
    const v = cell.value;
    if (touched && isFormula(v)) {
      const k = `${r},${c}`; if (evalMemo.has(k)) return evalMemo.get(k);
      if (depth > 40) return "#REF!";
      evalMemo.set(k, "#REF!");
      const res = evalFormula((v as unknown as { formula: string }).formula, (rr, cc) => raw(rr, cc, depth + 1));
      const out = typeof res === "string" && res.startsWith("#") && plain(v) !== null ? plain(v) : res;
      evalMemo.set(k, out); return out;
    }
    return plain(v);
  }
  const shownAt = (r: number, c: number) => { const cell = fc(sheet, r, c); return cell ? fmtValue(raw(r, c), cell.numFmt) : ""; };

  /* ---------- thao tác ô ---------- */
  const snap = (cell: Cell): Snap => ({ v: structuredClone(cell.value), s: structuredClone(cell.style) });
  const restore = (cell: Cell, s: Snap) => { cell.value = structuredClone(s.v); cell.style = structuredClone(s.s) as unknown as Cell["style"]; };
  const masterOf = (r: number, c: number): [number, number] => { if (!geo || !geo.slave.has(`${r},${c}`)) return [r, c]; const m = geo.merges.find((x) => r >= x.r1 && r <= x.r2 && c >= x.c1 && c <= x.c2); return m ? [m.r1, m.c1] : [r, c]; };
  function mutate(cells: [number, number][], fn: (cell: Cell, r: number, c: number) => void) {
    const w = ws(); if (!w) return;
    if (cells.length > 20000) { setInfo("Vùng chọn quá lớn (tối đa 20.000 ô)."); return; }
    const group: Change[] = []; const seen = new Set<string>();
    for (const [r0, c0] of cells) {
      const [r, c] = masterOf(r0, c0); const k = `${r},${c}`; if (seen.has(k)) continue; seen.add(k);
      const cell = w.getCell(r, c); const before = snap(cell); fn(cell, r, c); group.push({ sheet: sheetIdx, r, c, before, after: snap(cell) });
    }
    if (group.length) { undo.current.push(group); if (undo.current.length > 100) undo.current.shift(); redo.current = []; markDirty(); }
  }
  const selCells = (): [number, number][] => { const o: [number, number][] = []; for (let r = sel.r1; r <= sel.r2; r++) for (let c = sel.c1; c <= sel.c2; c++) o.push([r, c]); return o; };
  function applyHistory(from: Change[][], to: Change[][], useAfter: boolean) {
    const g = from.pop(); if (!g || !wbRef.current) return;
    for (const ch of useAfter ? g : [...g].reverse()) restore(wbRef.current.worksheets[ch.sheet].getCell(ch.r, ch.c), useAfter ? ch.after : ch.before);
    to.push(g); markDirty();
  }
  const doUndo = () => applyHistory(undo.current, redo.current, false);
  const doRedo = () => applyHistory(redo.current, undo.current, true);

  function commit(text: string, moveR = 1, moveC = 0) {
    if (!editRef.current) return;
    editRef.current = null;
    setEditing(null);
    const v = parseInput(text);
    if (editText(fc(ws(), sel.ar, sel.ac)?.value ?? null) !== text) mutate([[sel.ar, sel.ac]], (cell) => { cell.value = v; });
    moveTo(sel.ar + moveR, sel.ac + moveC);
    scroller.current?.focus();
  }
  function reveal(r: number, c: number) {
    const el = scroller.current; if (!el || !geo) return;
    const fh = geo.Y[fz.rows + 1] ?? 0, fw = geo.X[fz.cols + 1] ?? 0;
    const top = geo.Y[r], bottom = geo.Y[r + 1], left = geo.X[c], right = geo.X[c + 1];
    if (r > fz.rows && top < el.scrollTop + fh) el.scrollTop = Math.max(0, top - fh);
    else if (r > fz.rows && bottom + HDR_H > el.scrollTop + el.clientHeight) el.scrollTop = bottom + HDR_H - el.clientHeight + 4;
    if (c > fz.cols && left < el.scrollLeft + fw) el.scrollLeft = Math.max(0, left - fw);
    else if (c > fz.cols && right + HDR_W > el.scrollLeft + el.clientWidth) el.scrollLeft = right + HDR_W - el.clientWidth + 4;
  }
  const clampRC = (r: number, c: number): [number, number] => [Math.max(1, Math.min(geo?.nRows ?? 1, r)), Math.max(1, Math.min(geo?.nCols ?? 1, c))];
  function moveTo(r0: number, c0: number) { const [r, c] = clampRC(r0, c0); setSel({ ar: r, ac: c, r1: r, c1: c, r2: r, c2: c }); reveal(r, c); }
  function extendTo(r0: number, c0: number) {
    const [r, c] = clampRC(r0, c0);
    setSel((s0) => ({ ...s0, r1: Math.min(s0.ar, r), r2: Math.max(s0.ar, r), c1: Math.min(s0.ac, c), c2: Math.max(s0.ac, c) })); reveal(r, c);
  }

  /* ---------- chuột & bàn phím ---------- */
  function hit(e: { clientX: number; clientY: number }) {
    const el = scroller.current!; const b = el.getBoundingClientRect(); if (!geo) return null;
    const vx = e.clientX - b.left, vy = e.clientY - b.top;
    if (vx > el.clientWidth || vy > el.clientHeight) return null;
    const fw = geo.X[fz.cols + 1] ?? 0, fh = geo.Y[fz.rows + 1] ?? 0;
    const x = vx - HDR_W < fw ? vx - HDR_W : vx - HDR_W + el.scrollLeft;
    const y = vy - HDR_H < fh ? vy - HDR_H : vy - HDR_H + el.scrollTop;
    return { vx, vy, c: x < 0 ? 0 : Math.min(geo.nCols, bsearch(geo.X, x)), r: y < 0 ? 0 : Math.min(geo.nRows, bsearch(geo.Y, y)), x };
  }
  function onMouseDown(e: React.MouseEvent) {
    if (editing?.src === "cell") return;
    const h = hit(e); if (!h || !geo) return;
    if (h.r === 0 && h.c > 0) {
      const edge = Math.abs(h.x - geo.X[h.c + 1]) < 5;
      if (edge) { drag.current = { kind: "col", c: h.c, x0: e.clientX, w0: geo.X[h.c + 1] - geo.X[h.c] }; return; }
      setSel({ ar: 1, ac: h.c, r1: 1, c1: h.c, r2: geo.nRows, c2: h.c }); return;
    }
    if (h.c === 0 && h.r > 0) { setSel({ ar: h.r, ac: 1, r1: h.r, c1: 1, r2: h.r, c2: geo.nCols }); return; }
    if (h.r === 0 && h.c === 0) { setSel({ ar: 1, ac: 1, r1: 1, c1: 1, r2: geo.nRows, c2: geo.nCols }); return; }
    if (editing) commit(editing.text, 0, 0);
    drag.current = { kind: "sel" };
    if (e.shiftKey) extendTo(h.r, h.c); else setSel({ ar: h.r, ac: h.c, r1: h.r, c1: h.c, r2: h.r, c2: h.c });
    scroller.current?.focus();
  }
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      const d = drag.current; if (!d || !geo) return;
      if (d.kind === "col") { const w = Math.max(14, d.w0 + e.clientX - d.x0); const col = ws()?.getColumn(d.c); if (col) { col.width = (w - 5) / 7; force(); } return; }
      const h = hit(e); if (!h || h.r < 1 || h.c < 1) return;
      setSel((s) => ({ ...s, r1: Math.min(s.ar, h.r), r2: Math.max(s.ar, h.r), c1: Math.min(s.ac, h.c), c2: Math.max(s.ac, h.c) }));
    };
    const up = () => { if (drag.current?.kind === "col") markDirty(); drag.current = null; };
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  });
  function onDoubleClick(e: React.MouseEvent) { const h = hit(e); if (h && h.r > 0 && h.c > 0) startEdit(); }
  function startEdit(initial?: string) { const v = fc(ws(), sel.ar, sel.ac)?.value ?? null; setEditing({ text: initial ?? editText(v), src: "cell" }); }

  function selectionText() { const rows: string[] = []; for (let r = sel.r1; r <= sel.r2; r++) { const cs: string[] = []; for (let c = sel.c1; c <= sel.c2; c++) cs.push(shownAt(r, c).replace(/\t|\n/g, " ")); rows.push(cs.join("\t")); } return rows.join("\n"); }
  function pasteText(t: string) {
    const rows = t.replace(/\r/g, "").replace(/\n$/, "").split("\n").map((l) => l.split("\t"));
    const cells: [number, number][] = []; const vals = new Map<string, CellValue>();
    rows.forEach((row, i) => row.forEach((x, j) => { cells.push([sel.ar + i, sel.ac + j]); vals.set(`${sel.ar + i},${sel.ac + j}`, parseInput(x)); }));
    mutate(cells, (cell, r, c) => { cell.value = vals.get(`${r},${c}`) ?? null; });
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (editing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); doUndo(); return; }
    if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); doRedo(); return; }
    if (mod && e.key.toLowerCase() === "b") { e.preventDefault(); toggle("bold"); return; }
    if (mod && e.key.toLowerCase() === "i") { e.preventDefault(); toggle("italic"); return; }
    if (mod && e.key.toLowerCase() === "u") { e.preventDefault(); toggle("underline"); return; }
    if (mod && e.key.toLowerCase() === "a" && geo) { e.preventDefault(); setSel({ ar: 1, ac: 1, r1: 1, c1: 1, r2: geo.nRows, c2: geo.nCols }); return; }
    if (mod) return; // Ctrl+C/X/V xử lý ở onCopy/onCut/onPaste
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (d[e.key]) { e.preventDefault(); if (e.shiftKey) { const fr = sel.ar === sel.r1 ? sel.r2 : sel.r1, fc = sel.ac === sel.c1 ? sel.c2 : sel.c1; extendTo(fr + d[e.key][0], fc + d[e.key][1]); } else moveTo(sel.ar + d[e.key][0], sel.ac + d[e.key][1]); return; }
    if (e.key === "Tab") { e.preventDefault(); moveTo(sel.ar, sel.ac + (e.shiftKey ? -1 : 1)); return; }
    if (e.key === "Enter" || e.key === "F2") { e.preventDefault(); startEdit(); return; }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); mutate(selCells(), (cell) => { cell.value = null; }); return; }
    if (e.key.length === 1 && !e.altKey) { e.preventDefault(); startEdit(e.key); }
  }

  /* ---------- định dạng ---------- */
  function toggle(k: "bold" | "italic" | "underline") {
    const cur = fc(ws(), sel.ar, sel.ac)?.font?.[k]; const on = !cur;
    mutate(selCells(), (cell) => { cell.font = { ...(cell.font ?? {}), [k]: on } as unknown as Cell["font"]; });
  }
  const align = (h: "left" | "center" | "right") => mutate(selCells(), (cell) => { cell.alignment = { ...(cell.alignment ?? {}), horizontal: h, vertical: cell.alignment?.vertical ?? "middle" } as unknown as Cell["alignment"]; });
  const wrap = () => mutate(selCells(), (cell) => { cell.alignment = { ...(cell.alignment ?? {}), wrapText: !cell.alignment?.wrapText } as unknown as Cell["alignment"]; });
  const fillColor = (hex: string) => mutate(selCells(), (cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + hex.slice(1).toUpperCase() } } as unknown as Cell["fill"]; });
  const textColor = (hex: string) => mutate(selCells(), (cell) => { cell.font = { ...(cell.font ?? {}), color: { argb: "FF" + hex.slice(1).toUpperCase() } } as unknown as Cell["font"]; });
  const numFmtSet = (f: string) => mutate(selCells(), (cell) => { cell.numFmt = f; });
  const borders = () => mutate(selCells(), (cell) => { const s = { style: "thin", color: { argb: "FF000000" } }; cell.border = { top: s, left: s, bottom: s, right: s } as unknown as Cell["border"]; });

  /* ---------- thao tác cấu trúc (không hoàn tác được; có Lịch sử phiên bản) ---------- */
  function structural(label: string, op: (w: Worksheet) => void) {
    const w = ws(); if (!w) return;
    try { op(w); undo.current = []; redo.current = []; markDirty(); setInfo(`${label} — thao tác này không hoàn tác được bằng Ctrl+Z; có thể khôi phục ở mục Lịch sử.`); }
    catch { setInfo("Không thực hiện được thao tác này trên bảng hiện tại."); }
  }
  function reshape(kind: "row" | "col", at: number, del: boolean) {
    structural(del ? (kind === "row" ? "Đã xóa dòng" : "Đã xóa cột") : kind === "row" ? "Đã chèn dòng" : "Đã chèn cột", (w) => {
      const ms = (geo?.merges ?? []).map((m) => ({ ...m }));
      ms.forEach((m) => w.unMergeCells(m.r1, m.c1, m.r2, m.c2));
      if (kind === "row") { if (del) w.spliceRows(at, 1); else w.spliceRows(at, 0, []); } else { if (del) w.spliceColumns(at, 1); else w.spliceColumns(at, 0, []); }
      const a = kind === "row" ? ["r1", "r2"] as const : ["c1", "c2"] as const;
      for (const m of ms) {
        const lo = m[a[0]], hi = m[a[1]];
        let nl = lo, nh = hi;
        if (del) { if (lo === at && hi === at) continue; nl = lo > at ? lo - 1 : lo; nh = hi >= at ? hi - 1 : hi; } else { nl = lo >= at ? lo + 1 : lo; nh = hi >= at ? hi + 1 : hi; }
        const n = { ...m, [a[0]]: nl, [a[1]]: nh };
        if (n.r1 < n.r2 || n.c1 < n.c2) w.mergeCells(n.r1, n.c1, n.r2, n.c2);
      }
    });
  }
  function mergeSel() { if (sel.r1 === sel.r2 && sel.c1 === sel.c2) return; structural("Đã gộp ô", (w) => w.mergeCells(sel.r1, sel.c1, sel.r2, sel.c2)); }
  function unmergeSel() { structural("Đã bỏ gộp ô", (w) => { (geo?.merges ?? []).filter((m) => m.r1 <= sel.r2 && m.r2 >= sel.r1 && m.c1 <= sel.c2 && m.c2 >= sel.c1).forEach((m) => w.unMergeCells(m.r1, m.c1, m.r2, m.c2)); }); }
  function sortCol(asc: boolean) {
    const w = ws(); if (!w || !geo) return;
    const start = sel.ar + 1, last = w.rowCount, c0 = sel.ac;
    if (start >= last) { setInfo("Không có dòng dữ liệu bên dưới dòng đang chọn để sắp xếp (dòng đang chọn được xem là dòng tiêu đề)."); return; }
    if (geo.merges.some((m) => m.r2 >= start)) { setInfo("Vùng cần sắp xếp có ô gộp nên không sắp xếp được."); return; }
    structural(`Đã sắp xếp theo cột ${colName(c0)} ${asc ? "A→Z" : "Z→A"}`, (ww) => {
      const n = Math.max(ww.columnCount, 1); const rows: CellValue[][] = [];
      for (let r = start; r <= last; r++) { const row: CellValue[] = []; for (let c = 1; c <= n; c++) row.push(ww.getCell(r, c).value); rows.push(row); }
      const key = (row: CellValue[]) => plain(row[c0 - 1]);
      rows.sort((a, b) => { const x = key(a), y = key(b); if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1; const d = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi", { numeric: true }); return asc ? d : -d; });
      rows.forEach((row, i) => row.forEach((v, j) => { ww.getCell(start + i, j + 1).value = v; }));
    });
  }
  function addSheet() {
    const wb = wbRef.current; if (!wb) return;
    let n = wb.worksheets.length + 1, nm = `Sheet${n}`; while (wb.getWorksheet(nm)) nm = `Sheet${++n}`;
    wb.addWorksheet(nm); undo.current = []; redo.current = []; setSheetIdx(wb.worksheets.length - 1); markDirty();
  }
  async function importFile(f: File) {
    if (!confirm("Nhập file sẽ thay toàn bộ nội dung bảng tính hiện tại (phiên bản cũ vẫn được giữ trong Lịch sử). Tiếp tục?")) return;
    try { await loadBuffer(await f.arrayBuffer()); markDirty(); setInfo(`Đã nhập “${f.name}”.`); } catch { setInfo("Không đọc được file này (chỉ hỗ trợ .xlsx)."); }
  }
  async function exportXlsx() { const wb = wbRef.current; if (!wb) return; wb.calcProperties.fullCalcOnLoad = true; downloadBlob(new Uint8Array((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer), name, MIME_XLSX); }

  function printSheet() {
    const w = ws(); if (!w) return;
    const rows = Math.min(w.rowCount, 3000), cols = Math.min(w.columnCount, 60);
    const ms = new Map<string, Rect>(), sl = new Set<string>();
    (geo?.merges ?? []).forEach((m) => { for (let r = m.r1; r <= m.r2; r++) for (let c = m.c1; c <= m.c2; c++) (r === m.r1 && c === m.c1 ? ms.set(`${r},${c}`, m) : sl.add(`${r},${c}`)); });
    let h = `<table><colgroup>${Array.from({ length: cols }, (_, i) => `<col style="width:${Math.round((w.getColumn(i + 1).width ?? 8.43) * 7 + 5)}px">`).join("")}</colgroup>`;
    for (let r = 1; r <= rows; r++) {
      const row = fr(w, r); if (row?.hidden) continue;
      h += `<tr style="height:${Math.round((row?.height ?? 15) * 1.333)}px">`;
      for (let c = 1; c <= cols; c++) {
        if (sl.has(`${r},${c}`)) continue;
        const cell = fc(w, r, c); const l = look(cell); const m = ms.get(`${r},${c}`); const v = plain(cell?.value ?? null);
        const css = [l.bold && "font-weight:700", l.italic && "font-style:italic", l.underline && "text-decoration:underline", l.size && `font-size:${l.size}pt`, l.color && `color:${l.color}`, l.bg && `background:${l.bg}`, l.family && `font-family:'${l.family}',serif`,
          `text-align:${l.h === "center" || l.h === "centerContinuous" ? "center" : l.h === "right" || (!l.h && typeof v === "number") ? "right" : "left"}`, `vertical-align:${l.v === "top" ? "top" : l.v === "middle" || l.v === "center" ? "middle" : "bottom"}`, l.wrap ? "white-space:pre-wrap" : "white-space:nowrap",
          l.b.t && `border-top:${l.b.t}`, l.b.r && `border-right:${l.b.r}`, l.b.b && `border-bottom:${l.b.b}`, l.b.l && `border-left:${l.b.l}`].filter(Boolean).join(";");
        h += `<td${m ? ` rowspan="${m.r2 - m.r1 + 1}" colspan="${m.c2 - m.c1 + 1}"` : ""} style="${css}">${esc(cell ? fmtValue(plain(cell.value), cell.numFmt) : "")}</td>`;
      }
      h += "</tr>";
    }
    h += "</table>";
    const f = document.createElement("iframe"); f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0"; document.body.appendChild(f);
    const d = f.contentDocument!; d.open();
    d.write(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 ${orient};margin:10mm}body{margin:0;font-family:'Times New Roman',serif}table{border-collapse:collapse;table-layout:fixed;font-size:11pt}td{padding:1px 3px;overflow:hidden;border:0}</style></head><body>${h}</body></html>`); d.close();
    setTimeout(() => { f.contentWindow?.focus(); f.contentWindow?.print(); setTimeout(() => f.remove(), 2000); }, 300);
  }

  /* ---------- hiển thị ---------- */
  if (state === "loading") return <p className="animate-pulse py-20 text-center text-slate-600">Đang mở bảng tính...</p>;
  if (state === "error") return (<div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center" role="alert"><p className="font-semibold text-[#0f3b40]">Không thể mở trình chỉnh sửa</p><p className="mt-2 text-sm text-slate-600">{error}</p><div className="mt-5 flex justify-center gap-2"><button onClick={load} className="rounded-lg bg-[#0f3b40] px-4 py-2 text-white">↻ TẢI LẠI</button><Link href={docHref} className="rounded-lg border px-4 py-2">Về trang tài liệu</Link></div></div>);
  if (!sheet || !geo) return null;

  const { X, Y, nCols, nRows } = geo;
  const wb = wbRef.current!;
  const r0 = Math.max(fz.rows + 1, bsearch(Y, Math.max(0, scroll.top - HDR_H))), r1 = Math.min(nRows, bsearch(Y, scroll.top + scroll.h) + 1);
  const c0 = Math.max(fz.cols + 1, bsearch(X, Math.max(0, scroll.left - HDR_W))), c1 = Math.min(nCols, bsearch(X, scroll.left + scroll.w) + 1);
  const rowsList = [...Array.from({ length: Math.min(fz.rows, nRows) }, (_, i) => i + 1), ...Array.from({ length: Math.max(0, r1 - r0 + 1) }, (_, i) => r0 + i)];
  const colsList = [...Array.from({ length: Math.min(fz.cols, nCols) }, (_, i) => i + 1), ...Array.from({ length: Math.max(0, c1 - c0 + 1) }, (_, i) => c0 + i)];
  const drawn: { r: number; c: number; m?: Rect }[] = [];
  const seen = new Set<string>();
  for (const r of rowsList) for (const c of colsList) { const k = `${r},${c}`; if (geo.slave.has(k) || seen.has(k)) continue; seen.add(k); drawn.push({ r, c, m: geo.master.get(k) }); }
  for (const m of geo.merges) { const k = `${m.r1},${m.c1}`; if (!seen.has(k) && m.r2 >= r0 && m.r1 <= r1 && m.c2 >= c0 && m.c1 <= c1) { seen.add(k); drawn.push({ r: m.r1, c: m.c1, m }); } }
  const pin = (r: number, c: number) => ({ top: HDR_H + Y[r] + (r <= fz.rows ? scroll.top : 0), left: HDR_W + X[c] + (c <= fz.cols ? scroll.left : 0) });
  const rect = (r: number, c: number, m?: Rect) => { const p = pin(r, c); return { ...p, width: X[(m?.c2 ?? c) + 1] - X[c], height: Y[(m?.r2 ?? r) + 1] - Y[r] }; };
  const activeCell = fc(sheet, sel.ar, sel.ac);
  const af = activeCell?.font; const aa = activeCell?.alignment;
  const barText = editing ? editing.text : editText(activeCell?.value ?? null);

  return (
    <div className="space-y-3">
      <div className="no-print relative space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={docHref} className={btn}>← Thoát</Link>
          <span className="mx-1 hidden max-w-[240px] truncate text-sm font-semibold text-[#0f3b40] xl:block" title={name}>{name}</span>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">{version ? `Bản chỉnh sửa v${version}` : "Bản gốc"}</span>
          <i className="mx-1 h-6 w-px bg-slate-200" />
          <button className={btn} onClick={doUndo} disabled={!undo.current.length} title="Hoàn tác (Ctrl+Z)">↶</button>
          <button className={btn} onClick={doRedo} disabled={!redo.current.length} title="Làm lại (Ctrl+Y)">↷</button>
          <button className={`${btn} ${af?.bold ? "!bg-teal-100" : ""}`} onClick={() => toggle("bold")} title="Đậm"><b>B</b></button>
          <button className={`${btn} ${af?.italic ? "!bg-teal-100" : ""}`} onClick={() => toggle("italic")} title="Nghiêng"><i>I</i></button>
          <button className={`${btn} ${af?.underline ? "!bg-teal-100" : ""}`} onClick={() => toggle("underline")} title="Gạch chân"><u>U</u></button>
          <button className={`${btn} ${aa?.horizontal === "left" ? "!bg-teal-100" : ""}`} onClick={() => align("left")} title="Căn trái">⯇</button>
          <button className={`${btn} ${aa?.horizontal === "center" ? "!bg-teal-100" : ""}`} onClick={() => align("center")} title="Căn giữa">≡</button>
          <button className={`${btn} ${aa?.horizontal === "right" ? "!bg-teal-100" : ""}`} onClick={() => align("right")} title="Căn phải">⯈</button>
          <button className={btn} onClick={wrap} title="Xuống dòng trong ô">↵</button>
          <button className={btn} onClick={borders} title="Kẻ viền">▦</button>
          <label className={`${btn} cursor-pointer`} title="Màu nền">Nền<input type="color" className="ml-1 h-5 w-5 cursor-pointer border-0 bg-transparent p-0" defaultValue="#fff2cc" onChange={(e) => fillColor(e.target.value)} /></label>
          <label className={`${btn} cursor-pointer`} title="Màu chữ">Chữ<input type="color" className="ml-1 h-5 w-5 cursor-pointer border-0 bg-transparent p-0" defaultValue="#c00000" onChange={(e) => textColor(e.target.value)} /></label>
          <select className={`${btn} w-36 font-normal`} value="" onChange={(e) => e.target.value && numFmtSet(e.target.value)} aria-label="Định dạng số"><option value="">Định dạng số</option><option value="General">Chung</option><option value="0">Số nguyên</option><option value="0.00">Số 2 lẻ</option><option value="#,##0">Hàng nghìn</option><option value="0%">Phần trăm</option><option value="dd/mm/yyyy">Ngày</option></select>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <button className={btn} onClick={() => save("Lưu thủ công")}>Lưu ngay</button>
            <span className="relative"><button className={btn} onClick={() => setShowVer(!showVer)}>Lịch sử</button>{showVer && <VersionPanel docId={docId} current={version} onClose={() => setShowVer(false)} onRestored={() => { setShowVer(false); load(); }} />}</span>
            <button className={btn} onClick={() => fileIn.current?.click()}>Nhập .xlsx</button>
            <input ref={fileIn} type="file" accept=".xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
            <button className={btn} onClick={exportXlsx}>Xuất Excel</button>
            <select className={`${btn} w-28 font-normal`} value={orient} onChange={(e) => setOrient(e.target.value as "portrait" | "landscape")} aria-label="Hướng giấy"><option value="landscape">A4 ngang</option><option value="portrait">A4 dọc</option></select>
            <button className={btn} onClick={printSheet}>In / Xuất PDF</button>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} onClick={mergeSel}>Gộp ô</button><button className={btn} onClick={unmergeSel}>Bỏ gộp</button>
          <button className={btn} onClick={() => reshape("row", sel.ar, false)}>+ Dòng</button><button className={btn} onClick={() => reshape("row", sel.ar + 1, false)}>+ Dòng dưới</button><button className={btn} onClick={() => confirm(`Xóa dòng ${sel.ar}?`) && reshape("row", sel.ar, true)}>− Dòng</button>
          <button className={btn} onClick={() => reshape("col", sel.ac, false)}>+ Cột</button><button className={btn} onClick={() => confirm(`Xóa cột ${colName(sel.ac)}?`) && reshape("col", sel.ac, true)}>− Cột</button>
          <button className={btn} onClick={() => sortCol(true)} title="Sắp xếp các dòng bên dưới dòng đang chọn theo cột đang chọn">Sắp xếp A→Z</button><button className={btn} onClick={() => sortCol(false)}>Z→A</button>
          <button className={btn} onClick={() => setFrozen({ ...frozen, [sheetIdx]: { rows: fz.rows ? 0 : sel.ar, cols: fz.cols } })}>{fz.rows ? "Bỏ cố định dòng" : `Cố định đến dòng ${sel.ar}`}</button>
          <button className={btn} onClick={() => setFrozen({ ...frozen, [sheetIdx]: { rows: fz.rows, cols: fz.cols ? 0 : sel.ac } })}>{fz.cols ? "Bỏ cố định cột" : `Cố định đến cột ${colName(sel.ac)}`}</button>
          <span className="flex items-center gap-1"><input value={filter?.text ?? ""} onChange={(e) => setFilter(e.target.value ? { col: sel.ac, text: e.target.value, header: sel.ar } : null)} placeholder={`Lọc cột ${colName(sel.ac)}...`} className="h-9 w-36 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600" />{filter && <button className={btn} onClick={() => setFilter(null)}>×</button>}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-16 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">{colName(sel.ac)}{sel.ar}</span><span className="text-slate-400">fx</span>
          <input value={barText} onFocus={() => !editing && setEditing({ text: editText(activeCell?.value ?? null), src: "bar" })} onChange={(e) => setEditing({ text: e.target.value, src: "bar" })} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(barText); } if (e.key === "Escape") { setEditing(null); scroller.current?.focus(); } }} onBlur={() => editing?.src === "bar" && commit(editing.text, 0, 0)} className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600" aria-label="Thanh công thức" />
        </div>
      </div>

      {conflict && <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">Có người khác vừa lưu phiên bản mới hơn. <button className="font-bold underline" onClick={load}>Tải lại bản mới nhất</button> (thay đổi chưa lưu của bạn sẽ mất).</p>}
      {info && <p role="status" className="no-print rounded-xl bg-teal-50 px-4 py-2 text-sm text-teal-900">{info} <button className="ml-2 underline" onClick={() => setInfo("")}>Đóng</button></p>}

      <div ref={scroller} tabIndex={0} onScroll={(e) => { const t = e.currentTarget; setScroll((s) => ({ ...s, top: t.scrollTop, left: t.scrollLeft })); }} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onKeyDown={onKeyDown}
        onCopy={(e) => { if (editing) return; e.preventDefault(); e.clipboardData.setData("text/plain", selectionText()); }}
        onCut={(e) => { if (editing) return; e.preventDefault(); e.clipboardData.setData("text/plain", selectionText()); mutate(selCells(), (cell) => { cell.value = null; }); }}
        onPaste={(e) => { if (editing) return; e.preventDefault(); pasteText(e.clipboardData.getData("text/plain")); }}
        className="relative h-[calc(100vh-22rem)] min-h-[360px] select-none overflow-auto rounded-2xl border border-slate-200 bg-white outline-none focus:border-teal-500" style={{ fontFamily: '"Times New Roman", serif' }}>
        <div style={{ width: HDR_W + X[nCols + 1] + 40, height: HDR_H + Y[nRows + 1] + 40, position: "relative" }}>
          {drawn.map(({ r, c, m }) => {
            const cell = fc(sheet, r, c); const v = raw(r, c); const l = look(cell); const rc = rect(r, c, m);
            const pinned = r <= fz.rows || c <= fz.cols;
            return (<div key={`${r},${c}`} style={{ position: "absolute", ...rc, boxSizing: "border-box", overflow: "hidden", padding: "0 3px", fontSize: 14, borderRight: "1px solid #e5eaea", borderBottom: "1px solid #e5eaea", background: pinned ? "#fff" : undefined, zIndex: pinned ? 2 : 1, ...gridStyle(l, typeof v === "number") }}>{cell ? fmtValue(v, cell.numFmt) : ""}</div>);
          })}
          <div style={{ position: "absolute", pointerEvents: "none", zIndex: 3, border: "2px solid #0d9488", background: "rgba(13,148,136,0.08)", left: HDR_W + X[sel.c1], top: HDR_H + Y[sel.r1], width: X[sel.c2 + 1] - X[sel.c1], height: Y[sel.r2 + 1] - Y[sel.r1] }} />
          {editing?.src === "cell" && (() => { const k = masterOf(sel.ar, sel.ac); const m = geo.master.get(`${k[0]},${k[1]}`); const rc = rect(k[0], k[1], m); return (
            <input autoFocus value={editing.text} onChange={(e) => setEditing({ text: e.target.value, src: "cell" })} onBlur={() => commit(editing.text, 0, 0)}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); commit(editing.text, e.shiftKey ? -1 : 1, 0); } else if (e.key === "Tab") { e.preventDefault(); commit(editing.text, 0, e.shiftKey ? -1 : 1); } else if (e.key === "Escape") { setEditing(null); scroller.current?.focus(); } }}
              style={{ position: "absolute", ...rc, minWidth: rc.width, zIndex: 6, border: "2px solid #0f3b40", outline: "none", padding: "0 3px", fontSize: 14, background: "#fff", boxSizing: "border-box", userSelect: "text" }} />); })()}
          {/* tiêu đề cột & dòng (luôn ghim) */}
          <div style={{ position: "absolute", left: scroll.left, top: scroll.top, width: HDR_W, height: HDR_H, zIndex: 8, background: "#e8efee", borderRight: "1px solid #cbd7d5", borderBottom: "1px solid #cbd7d5" }} />
          {colsList.map((c) => (<div key={`h${c}`} style={{ position: "absolute", left: HDR_W + X[c] + (c <= fz.cols ? scroll.left : 0), top: scroll.top, width: X[c + 1] - X[c], height: HDR_H, zIndex: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: c >= sel.c1 && c <= sel.c2 ? "#c9ece8" : "#e8efee", borderRight: "1px solid #cbd7d5", borderBottom: "1px solid #cbd7d5", cursor: "col-resize" }}>{colName(c)}</div>))}
          {rowsList.map((r) => (<div key={`g${r}`} style={{ position: "absolute", top: HDR_H + Y[r] + (r <= fz.rows ? scroll.top : 0), left: scroll.left, width: HDR_W, height: Y[r + 1] - Y[r], zIndex: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: r >= sel.r1 && r <= sel.r2 ? "#c9ece8" : "#e8efee", borderRight: "1px solid #cbd7d5", borderBottom: "1px solid #cbd7d5" }}>{Y[r + 1] - Y[r] > 0 ? r : ""}</div>))}
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center gap-1.5">
        {wb.worksheets.map((w, i) => (<button key={w.id} onClick={() => { setSheetIdx(i); setSel({ ar: 1, ac: 1, r1: 1, c1: 1, r2: 1, c2: 1 }); setFilter(null); setEditing(null); }} className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${i === sheetIdx ? "border-teal-600 bg-teal-50 text-[#0f3b40]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{w.name}</button>))}
        <button onClick={addSheet} className="rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50" title="Thêm sheet">＋</button>
        <span className="ml-auto text-xs text-slate-500">Bản gốc không bị thay đổi · Biểu đồ/hình vẽ (nếu có) có thể không được giữ khi lưu bản chỉnh sửa</span>
      </div>
    </div>
  );
}
