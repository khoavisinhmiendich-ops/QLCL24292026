"use client";
import { useRouter } from "next/navigation";
import { SaveBadge } from "./SaveStatus";
export function Header({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  return (
    <header className="no-print flex h-14 items-center gap-4 border-b bg-brand-900 px-4 text-white">
      <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-xs font-bold text-brand-900" aria-hidden>QL</div>
      <h1 className="text-base font-semibold tracking-wide">QUẢN LÝ CHẤT LƯỢNG 2429.2026</h1>
      <span className="ml-2 hidden items-center gap-1 text-xs text-emerald-300 md:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" />Hệ thống hoạt động</span>
      <div className="ml-auto flex items-center gap-3">
        <SaveBadge />
        <span className="hidden text-sm md:block">{name} <span className="text-xs text-sky-200">({role})</span></span>
        <button onClick={logout} className="rounded border border-white/40 px-3 py-1 text-sm hover:bg-white/10">Đăng xuất</button>
      </div>
    </header>
  );
}
