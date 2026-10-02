"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [passkey, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, passkey }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Đăng nhập thất bại"); else { router.replace("/"); router.refresh(); }
    } catch { setErr("Không kết nối được máy chủ. Thử lại."); } finally { setBusy(false); }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 to-brand-600 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-bold text-brand-900">QUẢN LÝ CHẤT LƯỢNG 2429.2026</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục</p>
        <label className="block text-sm font-medium" htmlFor="u">Tài khoản</label>
        <input id="u" value={username} onChange={(e) => setU(e.target.value)} autoComplete="username" required className="mb-4 mt-1 w-full rounded border px-3 py-2" />
        <label className="block text-sm font-medium" htmlFor="p">Pass key</label>
        <input id="p" type="password" value={passkey} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required className="mt-1 w-full rounded border px-3 py-2" />
        {err && <p role="alert" className="mt-3 text-sm text-red-600">{err}</p>}
        <button disabled={busy} className="mt-6 w-full rounded bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60">{busy ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      </form>
    </main>
  );
}
