"use client";
import { useRouter } from "next/navigation";
import { SaveBadge } from "./SaveStatus";
import { SearchPalette } from "./SearchPalette";
import { Clock } from "./Clock";
import { Icon } from "./Icons";
const ROLE: Record<string, string> = { ADMIN: "Quản trị", MANAGER: "Quản lý", USER: "Người dùng", VIEWER: "Chỉ xem" };
export function Header({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  return (
    <header className="no-print sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white/90 pl-16 pr-6 backdrop-blur lg:pl-6">
      <SearchPalette />
      <div className="ml-auto flex items-center gap-4">
        <Clock />
        <span className="hidden items-center gap-2 whitespace-nowrap text-sm text-slate-500 2xl:flex"><span className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" />Hệ thống hoạt động</span>
        <SaveBadge />
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-[#0f3b40] text-base font-bold uppercase text-white">{name.slice(0, 1)}</span>
          <div className="hidden whitespace-nowrap leading-tight lg:block"><p className="text-[15px] font-bold">{name}</p><p className="text-[13px] text-slate-500">{ROLE[role] ?? role}</p></div>
        </div>
        <button onClick={logout} title="Đăng xuất" aria-label="Đăng xuất" className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 px-3 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><Icon name="logout" /><span className="hidden xl:inline">Đăng xuất</span></button>
      </div>
    </header>
  );
}
