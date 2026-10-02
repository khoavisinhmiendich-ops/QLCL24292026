import Link from "next/link";
import { chapters, bySection } from "@/lib/docs";
import { can, type Role } from "@/lib/rbac";
const link = "block rounded px-3 py-1.5 text-sm hover:bg-brand-50";
export function Sidebar({ role }: { role: Role }) {
  return (
    <nav aria-label="Menu chính" className="no-print w-72 shrink-0 overflow-y-auto border-r bg-white p-3">
      <Link href="/" className={`${link} font-semibold`}>TRANG CHỦ</Link>
      <p className="mb-1 mt-4 px-3 text-xs font-bold uppercase text-slate-400">12 chương</p>
      {chapters.map((c) => (
        <Link key={c.n} href={`/chuong/${c.n}`} className={link} title={c.title}>
          <span className="font-medium">Chương {c.n}</span> <span className="block truncate text-xs text-slate-500">{c.title}</span>
        </Link>
      ))}
      <p className="mb-1 mt-4 px-3 text-xs font-bold uppercase text-slate-400">Tài liệu</p>
      <Link href="/muc/handbook" className={link}>Sổ tay <span className="text-xs text-slate-400">({bySection("handbook").length})</span></Link>
      <Link href="/muc/other" className={link}>Tài liệu khác <span className="text-xs text-slate-400">({bySection("other").length})</span></Link>
      {can(role, "manage") && (<>
        <p className="mb-1 mt-4 px-3 text-xs font-bold uppercase text-slate-400">Quản lý</p>
        <Link href="/quan-ly" className={link}>Sao lưu &amp; nhật ký</Link>
      </>)}
    </nav>
  );
}
