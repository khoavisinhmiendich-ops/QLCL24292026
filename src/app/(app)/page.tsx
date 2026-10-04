import Link from "next/link";
import { totals, chapters, allDocs, bySection, shortTitle } from "@/lib/docs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Icon } from "@/components/Icons";
import { CountUp } from "@/components/CountUp";
import { Greeting } from "@/components/Clock";
export const dynamic = "force-dynamic";

const TZ = "Asia/Ho_Chi_Minh";
const ACTION: Record<string, string> = { login: "Đăng nhập", logout: "Đăng xuất", login_failed: "Đăng nhập thất bại", open_document: "Mở tài liệu", download: "Tải xuống", data_save: "Lưu dữ liệu", data_delete: "Xóa dữ liệu", data_restore: "Khôi phục dữ liệu", backup: "Sao lưu", restore: "Khôi phục sao lưu" };
const delay = (i: number) => ({ animationDelay: `${i * 60}ms` });

function Stat({ label, value, icon, tone, i }: { label: string; value: number; icon: string; tone: string; i: number }) {
  return (
    <div style={delay(i)} className="animate-rise group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-110 ${tone}`}><Icon name={icon} className="h-6 w-6" /></span>
      <div><p className="text-[28px] font-bold leading-none text-[#0f3b40]"><CountUp value={value} /></p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></div>
    </div>
  );
}

export default async function Dashboard() {
  const s = await getSession();
  const [entries, lastBackup, logs] = await Promise.all([
    db.moduleData.count().catch(() => 0),
    db.backup.findFirst({ orderBy: { createdAt: "desc" } }).catch(() => null),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { username: true } } } }).catch(() => []),
  ]);
  const types = [
    { label: "Word", n: totals.word, bar: "bg-blue-500" },
    { label: "PDF", n: totals.pdf, bar: "bg-red-500" },
    { label: "Excel", n: totals.excel, bar: "bg-emerald-500" },
    { label: "Hình ảnh", n: totals.image, bar: "bg-violet-500" },
  ];
  const maxCh = Math.max(...chapters.map((c) => allDocs.filter((d) => d.section === "chapter" && d.sectionOrder === c.n).length));

  return (
    <div className="space-y-8">
      <section className="animate-rise relative overflow-hidden rounded-3xl bg-[#0b3036] p-8 text-white shadow-lg" style={{ backgroundImage: "radial-gradient(ellipse 60% 90% at 90% 0%, rgba(94,234,212,0.28), transparent 70%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "auto, 44px 44px, 44px 44px" }}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">QĐ-2429/BYT · Khoa Vi sinh – Miễn dịch</p>
        <h2 className="font-display mt-2 text-[34px] font-semibold leading-tight"><Greeting name={s?.name ?? ""} /></h2>
        <p className="mt-2 max-w-xl text-base text-teal-100/80">Toàn bộ hồ sơ quản lý chất lượng của khoa: SOP, quy trình, biểu mẫu và tài liệu hướng dẫn, lưu tự động và an toàn.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/chuong/1" className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0f3b40] transition hover:-translate-y-0.5 hover:shadow-lg"><Icon name="layers" />Bắt đầu từ Chương 1</Link>
          <Link href="/muc/handbook" className="flex items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"><Icon name="book" />Sổ tay</Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat i={0} label="Chương" value={chapters.length} icon="layers" tone="bg-teal-50 text-teal-700" />
        <Stat i={1} label="Tổng tài liệu" value={totals.files} icon="folder" tone="bg-slate-100 text-slate-700" />
        <Stat i={2} label="PDF" value={totals.pdf} icon="file" tone="bg-red-50 text-red-600" />
        <Stat i={3} label="Word" value={totals.word} icon="doc" tone="bg-blue-50 text-blue-600" />
        <Stat i={4} label="Excel" value={totals.excel} icon="table" tone="bg-emerald-50 text-emerald-600" />
        <Stat i={5} label="Dữ liệu đã nhập" value={entries} icon="database" tone="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <h3 className="font-display mb-3 text-xl font-semibold text-[#0f3b40]">Các chương</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {chapters.map((c, i) => {
              const n = allDocs.filter((d) => d.section === "chapter" && d.sectionOrder === c.n).length;
              return (
                <Link key={c.n} href={`/chuong/${c.n}`} title={c.title} style={delay(i)} className="animate-rise group rounded-2xl border border-slate-200 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-teal-400 hover:shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0f3b40] text-xl font-bold text-teal-100 transition group-hover:bg-teal-700">{c.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold uppercase tracking-wider text-teal-700">Chương {c.n}</span>
                      <span className="block truncate text-[15px] font-bold text-[#12343a]">{shortTitle(c.title)}</span>
                    </span>
                    <Icon name="chevron" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-600" />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="bar-grow h-full rounded-full bg-teal-500" style={{ width: `${(n / maxCh) * 100}%`, animationDelay: `${i * 60 + 200}ms` }} /></div>
                    <span className="text-sm text-slate-500">{n} tài liệu</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="animate-rise rounded-2xl border border-slate-200 bg-white p-5" style={delay(2)}>
            <h3 className="font-display text-lg font-semibold text-[#0f3b40]">Cơ cấu tài liệu</h3>
            <ul className="mt-4 space-y-3">
              {types.filter((t) => t.n > 0).map((t, i) => (
                <li key={t.label}>
                  <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{t.label}</span><span className="tabular text-slate-500">{t.n} · {Math.round((t.n / totals.files) * 100)}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`bar-grow h-full rounded-full ${t.bar}`} style={{ width: `${(t.n / totals.files) * 100}%`, animationDelay: `${i * 120}ms` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">Sổ tay: <b>{bySection("handbook").length}</b> · Tài liệu khác: <b>{bySection("other").length}</b></p>
          </section>

          <section className="animate-rise rounded-2xl border border-slate-200 bg-white p-5" style={delay(3)}>
            <h3 className="font-display text-lg font-semibold text-[#0f3b40]">Hoạt động gần đây</h3>
            {logs.length === 0 ? <p className="mt-3 text-sm text-slate-400">Chưa có hoạt động nào.</p> : (
              <ul className="mt-3 space-y-3">
                {logs.map((l) => (
                  <li key={l.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{ACTION[l.action] ?? l.action}{l.target && !l.action.startsWith("login") && l.action !== "logout" ? <span className="font-normal text-slate-500"> · {l.target.split("/").pop()?.replace(/\.[^.]+$/, "")}</span> : null}</span>
                      <span className="block truncate text-xs text-slate-400">{l.user?.username ?? "-"} · {l.createdAt.toLocaleString("vi-VN", { timeZone: TZ })}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">Sao lưu gần nhất: <b className="text-slate-700">{lastBackup ? lastBackup.createdAt.toLocaleString("vi-VN", { timeZone: TZ }) : "Chưa có"}</b></p>
          </section>
        </aside>
      </div>
    </div>
  );
}
