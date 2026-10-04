"use client";
import { useCallback, useEffect, useState } from "react";

type V = { version: number; size: number; note: string | null; createdAt: string; user: string };

/** Lịch sử phiên bản của file Word/Excel đã chỉnh sửa: xem ai sửa, khi nào, và khôi phục. */
export function VersionPanel({ docId, current, onRestored, onClose }: { docId: string; current: number; onRestored: () => void; onClose: () => void }) {
  const [list, setList] = useState<V[] | null>(null);
  const [msg, setMsg] = useState("");
  const load = useCallback(() => fetch(`/api/documents/${docId}/edit?versions=1`, { cache: "no-store" }).then((r) => r.json()).then((j) => setList(j.versions ?? [])).catch(() => setMsg("Không tải được lịch sử")), [docId]);
  useEffect(() => { load(); }, [load, current]);

  async function restore(v: number) {
    if (!confirm(`Khôi phục về phiên bản ${v}? Phiên bản hiện tại vẫn được giữ trong lịch sử.`)) return;
    const r = await fetch(`/api/documents/${docId}/edit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ restore: v }) });
    if (r.ok) onRestored(); else setMsg((await r.json().catch(() => ({}))).error ?? "Khôi phục thất bại");
  }
  return (
    <div className="animate-pop absolute right-0 top-full z-40 mt-2 w-[420px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-lg font-semibold text-[#0f3b40]">Lịch sử phiên bản</h3><button onClick={onClose} className="rounded px-2 text-lg leading-none hover:bg-slate-100" aria-label="Đóng">×</button></div>
      {msg && <p className="mb-2 text-sm text-red-600">{msg}</p>}
      {list === null ? <p className="text-sm text-slate-500">Đang tải...</p> : list.length === 0 ? <p className="text-sm text-slate-500">Chưa có bản chỉnh sửa nào được lưu. Bản gốc luôn được giữ nguyên.</p> : (
        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto text-sm">
          {list.map((v) => (
            <li key={v.version} className="flex items-center gap-3 py-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${v.version === current ? "bg-[#0f3b40] text-white" : "bg-slate-100 text-slate-600"}`}>v{v.version}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{v.user}{v.note ? <span className="font-normal text-slate-500"> · {v.note}</span> : null}</span><span className="block text-xs text-slate-500">{new Date(v.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {Math.round(v.size / 1024)} KB</span></span>
              {v.version === current ? <span className="text-xs font-semibold text-teal-700">Đang dùng</span> : <button onClick={() => restore(v.version)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold hover:bg-teal-50">Khôi phục</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
