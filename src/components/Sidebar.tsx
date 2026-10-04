import Link from "next/link";
import { chapters, bySection, categorize, shortTitle, type Doc } from "@/lib/docs";
import { can, type Role } from "@/lib/rbac";
import { Icon } from "./Icons";
import { NavLink } from "./NavLink";

const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-teal-50/90 transition hover:translate-x-0.5 hover:bg-white/10";
const on = "bg-white/15 font-semibold text-white";
const label = "mb-2 mt-6 px-3 text-xs font-bold uppercase tracking-[0.14em] text-teal-300/60";
const CAT_ICON: Record<string, string> = { sop: "layers", bm: "table", pdf: "file", other: "doc" };

function Block({ title, badge, icon, href, docs }: { title: string; badge?: number; icon?: string; href: string; docs: Doc[] }) {
  return (
    <details className="group">
      <summary className={`${item} cursor-pointer list-none`} title={title}>
        {badge !== undefined
          ? <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-teal-200">{badge}</span>
          : <Icon name={icon ?? "folder"} className="h-5 w-5 shrink-0 text-teal-300" />}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="text-[11px] text-teal-300/60">{docs.length}</span>
        <Icon name="chevron" className="h-3.5 w-3.5 shrink-0 text-teal-300/50 transition-transform group-open:rotate-90" />
      </summary>
      <div className="ml-6 border-l border-white/10 pl-2">
        <NavLink href={href} className="block rounded px-2 py-1 text-[13px] font-semibold text-teal-300 hover:text-white" activeClassName="text-white">Xem toàn bộ →</NavLink>
        {categorize(docs).map((g) => (
          <details key={g.key} className="group/sub">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-teal-100/90 hover:bg-white/10">
              <Icon name={CAT_ICON[g.key]} className="h-3.5 w-3.5 shrink-0 text-teal-300/80" />
              <span className="min-w-0 flex-1 truncate">{g.label}</span>
              <span className="text-[11px] text-teal-300/60">{g.docs.length}</span>
              <Icon name="chevron" className="h-3 w-3 shrink-0 text-teal-300/40 transition-transform group-open/sub:rotate-90" />
            </summary>
            <ul className="ml-3 border-l border-white/10 pl-2">
              {g.docs.map((d) => (
                <li key={d.id}><NavLink href={`/tai-lieu/${d.id}`} title={d.name} className="block truncate rounded px-2 py-1 text-[13px] text-teal-100/70 hover:bg-white/10 hover:text-white" activeClassName="bg-white/15 font-semibold !text-white">{d.name.replace(/\.[^.]+$/, "")}</NavLink></li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </details>
  );
}

export function Sidebar({ role, mobile = false }: { role: Role; mobile?: boolean }) {
  return (
    <nav aria-label="Menu chính" className={mobile ? "flex flex-col p-4 text-white" : "no-print hidden w-72 shrink-0 flex-col overflow-y-auto bg-[#0b3036] p-4 text-white lg:flex"}>
      <Link href="/" className="mb-6 flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-teal-200"><Icon name="shield" className="h-5 w-5" /></span>
        <span className="leading-tight"><span className="block text-sm font-bold tracking-wide">HỆ THỐNG HSCL</span><span className="block text-xs font-medium text-teal-300">Khoa Vi sinh – Miễn dịch</span></span>
      </Link>
      <NavLink href="/" className={item} activeClassName={on}><Icon name="home" className="h-5 w-5 text-teal-300" />Trang chủ</NavLink>
      <p className={label}>12 chương</p>
      {chapters.map((c) => <Block key={c.n} badge={c.n} title={shortTitle(c.title)} href={`/chuong/${c.n}`} docs={bySection("chapter", c.n)} />)}
      <p className={label}>Tài liệu</p>
      <Block title="Sổ tay" icon="book" href="/muc/handbook" docs={bySection("handbook")} />
      <Block title="Tài liệu khác" icon="folder" href="/muc/other" docs={bySection("other")} />
      {can(role, "manage") && (<>
        <p className={label}>Quản lý</p>
        <NavLink href="/quan-ly" className={item} activeClassName={on}><Icon name="database" className="h-5 w-5 text-teal-300" />Sao lưu &amp; nhật ký</NavLink>
        {can(role, "admin") && <NavLink href="/quan-ly/nguoi-dung" className={item} activeClassName={on}><Icon name="users" className="h-5 w-5 text-teal-300" />Người dùng &amp; phân quyền</NavLink>}
        <NavLink href="/tim-kiem" className={item} activeClassName={on}><Icon name="search" className="h-5 w-5 text-teal-300" />Tìm kiếm nâng cao</NavLink>
      </>)}
    </nav>
  );
}
