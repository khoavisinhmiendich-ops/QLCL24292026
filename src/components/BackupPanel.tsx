"use client";
import { useEffect, useState } from "react";
type B = { id: string; note: string | null; createdAt: string };
export function BackupPanel({ canRestore }: { canRestore: boolean }) {
  const [list, setList] = useState<B[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => fetch("/api/backup").then((r) => r.json()).then((j) => setList(j.backups ?? [])).catch(() => setMsg("Không tải được danh sách sao lưu"));
  useEffect(() => { load(); }, []);
  async function now() { setMsg("Đang sao lưu..."); const r = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); setMsg(r.ok ? "✓ Đã sao lưu" : "Sao lưu thất bại. Thử lại"); load(); }
  async function restore(id: string) {
    if (!confirm("Khôi phục dữ liệu từ bản sao lưu này? Dữ liệu hiện tại được giữ trong lịch sử phiên bản.")) return;
    const r = await fetch("/api/backup", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setMsg(r.ok ? "✓ Đã khôi phục" : "Khôi phục thất bại");
  }
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="flex items-center gap-3"><button onClick={now} className="rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">Backup now</button><span className="text-sm">{msg}</span></div>
      <p className="mt-3 text-sm text-slate-600">Last backup: {list[0] ? new Date(list[0].createdAt).toLocaleString("vi-VN") : "Chưa có"}</p>
      <ul className="mt-2 text-sm">{list.map((b) => (<li key={b.id} className="flex items-center gap-3 border-t py-1"><span>{new Date(b.createdAt).toLocaleString("vi-VN")}</span><span className="text-slate-500">{b.note}</span>{canRestore && <button onClick={() => restore(b.id)} className="ml-auto text-brand-600 underline">Khôi phục</button>}</li>))}</ul>
    </section>
  );
}
