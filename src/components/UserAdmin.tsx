"use client";
import { useCallback, useEffect, useState } from "react";

type U = { id: string; username: string; displayName: string; role: string; active: boolean; createdAt: string };
const ROLES: [string, string][] = [["ADMIN", "Quản trị (toàn quyền)"], ["MANAGER", "Quản lý tài liệu & dữ liệu"], ["USER", "Nhập & sửa dữ liệu"], ["VIEWER", "Chỉ xem"]];
const inp = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

export function UserAdmin({ currentId }: { currentId: string }) {
  const [users, setUsers] = useState<U[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [form, setForm] = useState({ username: "", displayName: "", role: "USER", passkey: "" });
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");

  const load = useCallback(() => fetch("/api/users").then((r) => r.json()).then((j) => setUsers(j.users ?? [])).catch(() => setMsg({ ok: false, t: "Không tải được danh sách" })), []);
  useEffect(() => { load(); }, [load]);

  async function call(method: "POST" | "PATCH", body: object, okText: string) {
    const r = await fetch("/api/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setMsg({ ok: r.ok, t: r.ok ? `✓ ${okText}` : j.error ?? "Thao tác thất bại" });
    if (r.ok) load();
    return r.ok;
  }
  async function create(e: React.FormEvent) { e.preventDefault(); if (await call("POST", form, "Đã tạo tài khoản")) setForm({ username: "", displayName: "", role: "USER", passkey: "" }); }

  return (
    <div className="space-y-6">
      {msg && <p role="status" className={`rounded-lg px-4 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.t}</p>}
      <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-display mb-3 text-lg font-semibold text-[#0f3b40]">Tạo tài khoản mới</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input className={inp} placeholder="Tên đăng nhập" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} required />
          <input className={inp} placeholder="Họ và tên hiển thị" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          <select className={inp} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <input className={inp} type="password" placeholder="Pass key (≥ 10 ký tự)" value={form.passkey} onChange={(e) => setForm({ ...form, passkey: e.target.value })} autoComplete="new-password" required />
          <button className="h-10 rounded-lg bg-[#0f3b40] px-4 text-sm font-bold text-white transition hover:bg-teal-700">Tạo tài khoản</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500"><tr><th className="p-3">Tài khoản</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th><th className="pr-3 text-right">Thao tác</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{u.username}{u.id === currentId && <span className="ml-2 rounded bg-teal-50 px-1.5 py-0.5 text-[11px] text-teal-700">Bạn</span>}</td>
                <td>{u.displayName}</td>
                <td><select className={`${inp} h-9`} value={u.role} disabled={u.id === currentId} onChange={(e) => call("PATCH", { id: u.id, role: e.target.value }, "Đã đổi vai trò")}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                <td><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.active ? "Hoạt động" : "Đã khóa"}</span></td>
                <td className="py-2 pr-3 text-right">
                  {resetFor === u.id ? (
                    <span className="inline-flex gap-2">
                      <input className={`${inp} h-9 w-44`} type="password" placeholder="Pass key mới" value={newKey} onChange={(e) => setNewKey(e.target.value)} autoComplete="new-password" />
                      <button className="rounded-lg bg-[#0f3b40] px-3 text-xs font-bold text-white" onClick={async () => { if (await call("PATCH", { id: u.id, passkey: newKey }, "Đã đặt pass key mới")) { setResetFor(null); setNewKey(""); } }}>Lưu</button>
                      <button className="rounded-lg border px-3 text-xs" onClick={() => { setResetFor(null); setNewKey(""); }}>Hủy</button>
                    </span>
                  ) : (
                    <span className="inline-flex gap-2">
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-teal-50" onClick={() => setResetFor(u.id)}>Đặt pass key</button>
                      {u.id !== currentId && <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50" onClick={() => { if (!u.active || confirm(`Khóa tài khoản "${u.username}"?`)) call("PATCH", { id: u.id, active: !u.active }, u.active ? "Đã khóa tài khoản" : "Đã mở khóa"); }}>{u.active ? "Khóa" : "Mở khóa"}</button>}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">Quản trị: toàn quyền · Quản lý: quản lý tài liệu, sao lưu, nhật ký · Người dùng: nhập và sửa dữ liệu · Chỉ xem: chỉ đọc tài liệu.</p>
    </div>
  );
}
