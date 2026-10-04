"use client";
import { useState } from "react";
import { useAutosave } from "@/hooks/useAutosave";

type V = { version: number; createdAt: string; user: string; preview: string };
const NOTE_RE = /^\{"note":"([\s\S]*?)"?\}?$/;
const peek = (p: string) => { const m = NOTE_RE.exec(p); return (m ? m[1] : p).replace(/\\n/g, " ").slice(0, 70); };

/** Ghi chú/biểu mẫu nhập liệu gắn với một tài liệu; tự lưu vào database, có lịch sử phiên bản. */
export function AutosaveNotes({ documentId, canEdit }: { documentId: string; canEdit: boolean }) {
  const { data, update, loaded, retry } = useAutosave<{ note: string }>("doc-notes", documentId, { note: "" });
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<V[] | null>(null);
  const [rowId, setRowId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  async function toggleHistory() {
    if (open) { setOpen(false); return; }
    setOpen(true); setList(null);
    try {
      const cur = await (await fetch(`/api/module-data?module=doc-notes&documentId=${documentId}`, { cache: "no-store" })).json();
      setRowId(cur.id ?? null);
      if (cur.id) setList((await (await fetch(`/api/module-data/versions?id=${cur.id}`, { cache: "no-store" })).json()).versions ?? []); else setList([]);
    } catch { setMsg("Không tải được lịch sử"); setList([]); }
  }
  async function restore(version: number) {
    if (!rowId || !confirm(`Khôi phục ghi chú về phiên bản ${version}?`)) return;
    const r = await fetch("/api/module-data/versions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: rowId, version }) });
    if (r.ok) window.location.reload(); else setMsg((await r.json().catch(() => ({}))).error ?? "Khôi phục thất bại");
  }
  if (!loaded) return <p className="text-sm text-slate-500">Đang tải...</p>;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-3"><h3 className="text-sm font-bold">Ghi chú / dữ liệu nhập</h3><span className="text-xs text-slate-400">Tự động lưu vào hệ thống</span><button onClick={toggleHistory} className="ml-auto text-xs font-semibold text-teal-700 underline">{open ? "Ẩn lịch sử" : "Lịch sử phiên bản"}</button></div>
      <textarea aria-label="Ghi chú" readOnly={!canEdit} value={data.note} onChange={(e) => update({ note: e.target.value })} rows={5} className="w-full rounded-xl border border-slate-200 p-3 text-[15px] outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" placeholder={canEdit ? "Nhập nội dung, hệ thống tự động lưu..." : "Bạn chỉ có quyền xem"} />
      <button onClick={retry} className="mt-2 text-xs text-teal-700 underline">Lưu lại ngay</button>
      {msg && <p className="mt-2 text-sm text-red-600">{msg}</p>}
      {open && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          {list === null ? <p className="text-slate-500">Đang tải...</p> : list.length === 0 ? <p className="text-slate-500">Chưa có phiên bản nào.</p> : (
            <ul className="divide-y divide-slate-200">{list.map((v) => (
              <li key={v.version} className="flex items-center gap-3 py-2">
                <span className="w-9 shrink-0 text-xs font-bold text-slate-500">v{v.version}</span>
                <span className="min-w-0 flex-1"><span className="block truncate">{peek(v.preview) || "(trống)"}</span><span className="block text-xs text-slate-500">{v.user} · {new Date(v.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span></span>
                {canEdit && <button onClick={() => restore(v.version)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-teal-50">Khôi phục</button>}
              </li>))}</ul>
          )}
        </div>
      )}
    </section>
  );
}
