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
    <div
      style={delay(i)}
      className="group rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-200 hover:shadow-[0_10px_24px_rgba(22,119,200,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Live</span>
      </div>

      <div className="mt-5">
        <p className="text-[28px] font-bold leading-none tracking-[-0.04em] text-[#172B3A]">
          <CountUp value={value} />
        </p>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      </div>
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
    { label: "Word", n: totals.word, bar: "bg-[#1677C8]" },
    { label: "PDF", n: totals.pdf, bar: "bg-[#DC2626]" },
    { label: "Excel", n: totals.excel, bar: "bg-[#16A34A]" },
    { label: "Hình ảnh", n: totals.image, bar: "bg-[#7C3AED]" },
  ];

  const maxCh = Math.max(1, ...chapters.map((c) => allDocs.filter((d) => d.section === "chapter" && d.sectionOrder === c.n).length));
  const safePercent = (n: number) => (totals.files > 0 ? (n / totals.files) * 100 : 0);

  return (
    <div className="min-h-screen bg-[#F5F8FA] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="relative overflow-hidden rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)] md:p-6">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(22,119,200,0.10),_transparent_55%)] lg:block" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1677C8]">QĐ-2429/BYT · Khoa Vi sinh – Miễn dịch</p>
              <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[#172B3A] md:text-[32px]">
                <Greeting name={s?.name ?? ""} />
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-slate-600">
                Toàn bộ hồ sơ quản lý chất lượng của khoa được quản lý tập trung, an toàn và có thể truy xuất nhanh.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/chuong/1"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0B2638] bg-[#0B2638] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#102f45] focus:outline-none focus:ring-2 focus:ring-[#1677C8]/40"
              >
                <Icon name="layers" className="h-4 w-4" />
                Bắt đầu từ Chương 1
              </Link>
              <Link
                href="/muc/handbook"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#172B3A] transition-all duration-200 hover:-translate-y-[1px] hover:border-sky-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1677C8]/30"
              >
                <Icon name="book" className="h-4 w-4" />
                Sổ tay
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Stat i={0} label="Chương" value={chapters.length} icon="layers" tone="bg-[#E7F7F5] text-[#0F766E]" />
          <Stat i={1} label="Tổng tài liệu" value={totals.files} icon="folder" tone="bg-[#EEF2FF] text-[#374151]" />
          <Stat i={2} label="PDF" value={totals.pdf} icon="file" tone="bg-[#FEE2E2] text-[#DC2626]" />
          <Stat i={3} label="Word" value={totals.word} icon="doc" tone="bg-[#DBEAFE] text-[#1677C8]" />
          <Stat i={4} label="Excel" value={totals.excel} icon="table" tone="bg-[#DCFCE7] text-[#16A34A]" />
          <Stat i={5} label="Dữ liệu đã nhập" value={entries} icon="database" tone="bg-[#FEF3C7] text-[#B45309]" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.02)] md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Tổng quan</p>
                <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-[#172B3A]">Các chương</h3>
              </div>

              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {chapters.length} chương
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {chapters.map((c, i) => {
                const n = allDocs.filter((d) => d.section === "chapter" && d.sectionOrder === c.n).length;
                const progress = (n / maxCh) * 100;
                return (
                  <Link
                    key={c.n}
                    href={`/chuong/${c.n}`}
                    title={c.title}
                    style={delay(i)}
                    className="group rounded-[14px] border border-slate-200 bg-[#FBFCFD] p-4 transition-all duration-200 hover:-translate-y-[1px] hover:border-[#0F766E]/30 hover:shadow-[0_10px_22px_rgba(15,118,110,0.08)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#0B2638] text-lg font-bold text-white shadow-sm">
                        {c.n}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F766E]">Chương {c.n}</p>
                        <p className="mt-1 truncate text-[14px] font-semibold text-[#172B3A]">{shortTitle(c.title)}</p>
                      </div>

                      <Icon name="chevron" className="h-4 w-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#0F766E]" />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#0F766E] transition-all duration-200" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[12px] font-medium text-slate-500">{n} tài liệu</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.02)] md:p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#172B3A]">Cơ cấu tài liệu</h3>
                <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1677C8]">
                  {totals.files} files
                </span>
              </div>

              <ul className="mt-4 space-y-4">
                {types.map((t, i) => {
                  const pct = safePercent(t.n);
                  return (
                    <li key={t.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                        <span className="font-medium text-slate-600">{t.label}</span>
                        <span className="tabular-nums text-slate-500">
                          {t.n} · {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[12px] text-slate-500">
                <span className="font-medium text-slate-600">Sổ tay:</span> {bySection("handbook").length} · {" "}
                <span className="font-medium text-slate-600">Tài liệu khác:</span> {bySection("other").length}
              </div>
            </section>

            <section className="rounded-[18px] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.02)] md:p-5">
              <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#172B3A]">Hoạt động gần đây</h3>

              {logs.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Chưa có hoạt động nào.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {logs.map((l) => (
                    <li key={l.id} className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0F766E]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#172B3A]">
                          {ACTION[l.action] ?? l.action}
                          {l.target && !l.action.startsWith("login") && l.action !== "logout" ? (
                            <span className="font-normal text-slate-500"> · {l.target.split("/").pop()?.replace(/\.[^.]+$/, "")}</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-400">
                          {l.user?.username ?? "-"} · {l.createdAt.toLocaleString("vi-VN", { timeZone: TZ })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-500">Sao lưu gần nhất</p>
                <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${lastBackup ? "bg-[#16A34A]" : "bg-slate-300"}`} />
                  <span>{lastBackup ? lastBackup.createdAt.toLocaleString("vi-VN", { timeZone: TZ }) : "Chưa có"}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.03)] md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1677C8]">Workspace</p>
              <h3 className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-[#172B3A]">Office app hero</h3>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tự động lưu
              </span>
            </div>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-[#eef3f8] p-3">
            <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="bg-[#f5f7fa] px-4 pt-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
                  {['File', 'Home', 'Insert', 'Layout', 'References', 'Review', 'View'].map((tab, idx) => (
                    <span key={tab} className={`rounded-t-md border border-b-0 px-3 py-2 ${idx === 1 ? 'bg-white text-[#0f3a5b] shadow-[0_-1px_0_rgba(15,23,42,0.04)]' : 'border-slate-200 bg-[#f2f5f9] text-slate-500'}`}>
                      {tab}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600">
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Save</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Print</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Undo</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Redo</span>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-bold">B</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 italic">I</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 underline">U</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">A</span>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">11</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Calibri</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Auto save</span>
                  <span className="rounded bg-[#0B2638] px-2.5 py-1.5 font-semibold text-white">Save</span>
                </span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[230px_minmax(0,1fr)]">
                <aside className="border-r border-slate-200 bg-[#f8fafc] p-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Document structure</p>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-lg bg-sky-50 px-2 py-1.5 text-[12px] font-semibold text-[#1677C8]">1. Mục tiêu</div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-[12px] text-slate-600">2. Phạm vi</div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-[12px] text-slate-600">3. Tài liệu liên quan</div>
                      <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-[12px] text-slate-600">4. Hồ sơ an toàn</div>
                    </div>
                  </div>
                </aside>

                <div className="bg-[#f5f8fa] p-5">
                  <div className="mx-auto max-w-[760px] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]" style={{ minHeight: 760 }}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      <span>Trang 1</span>
                      <span>Word</span>
                    </div>

                    <div className="space-y-5 px-8 py-8 text-[#172B3A]">
                      <div className="text-center">
                        <p className="text-[24px] font-bold tracking-[-0.04em]">QUY TRÌNH QUẢN LÝ CHẤT LƯỢNG</p>
                        <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-slate-500">Khoa vi sinh – miễn dịch</p>
                      </div>

                      <div className="space-y-2 text-[14px] leading-7">
                        <p className="font-bold text-[#0B2638]">1. Mục tiêu</p>
                        <p>Đảm bảo toàn bộ hồ sơ, quy trình và tài liệu chất lượng được quản lý tập trung, có thể truy xuất nhanh và được kiểm soát theo đúng chuẩn của Bộ Y tế.</p>
                        <p>Toàn bộ nội dung được cập nhật theo phiên bản và lịch sử chỉnh sửa để hỗ trợ kiểm toán, audit nội bộ và cập nhật liên tục.</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-slate-500">Điều kiện</p>
                        <ul className="list-disc pl-5 text-[14px] leading-7 text-slate-700">
                          <li>Hồ sơ lưu an toàn và được backup định kỳ.</li>
                          <li>Được kiểm soát theo phân quyền rõ ràng.</li>
                          <li>Có lịch sử cập nhật để truy xuất.</li>
                        </ul>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0F766E]">Khu vực 1</p>
                          <p className="mt-2 text-[14px] leading-6 text-slate-700">Kiểm soát hồ sơ và quy trình quản lý chất lượng.</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#1677C8]">Khu vực 2</p>
                          <p className="mt-2 text-[14px] leading-6 text-slate-700">Giám sát hoạt động, sao lưu và đánh giá nội bộ.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-slate-200 bg-[#edf2f7] p-3">
            <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
              <div className="bg-[#f5f7fa] px-4 pt-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
                  {['File', 'Home', 'Insert', 'Formulas', 'Data', 'Review', 'View'].map((tab, idx) => (
                    <span key={tab} className={`rounded-t-md border border-b-0 px-3 py-2 ${idx === 1 ? 'bg-white text-[#14532d] shadow-[0_-1px_0_rgba(15,23,42,0.04)]' : 'border-slate-200 bg-[#f2f5f9] text-slate-500'}`}>
                      {tab}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-600">
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Paste</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Cut</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">Copy</span>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">B</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 italic">I</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1 underline">U</span>
                <span className="mx-1 h-5 w-px bg-slate-200" />
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">11</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-1">General</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Auto save</span>
                  <span className="rounded bg-[#16A34A] px-2.5 py-1.5 font-semibold text-white">Save</span>
                </span>
              </div>

              <div className="border-b border-slate-200 bg-[#f9fbfc] px-3 py-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="rounded border border-slate-200 bg-white px-2 py-1">fx</span>
                  <span className="min-w-[180px] rounded border border-sky-200 bg-sky-50 px-2 py-1 font-medium text-[#1677C8]">=SUM(C2:C6)</span>
                  <span className="ml-auto rounded border border-slate-200 bg-white px-2 py-1">Sheet1</span>
                </div>
              </div>

              <div className="overflow-hidden bg-[#f5f8fa] p-4">
                <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white">
                  <div className="grid grid-cols-[52px_repeat(6,minmax(0,1fr))] border-b border-slate-200 bg-slate-100 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <div className="border-r border-slate-200 p-2 text-center">#</div>
                    {['A', 'B', 'C', 'D', 'E', 'F'].map((c) => (
                      <div key={c} className="border-r border-slate-200 p-2 text-center">{c}</div>
                    ))}
                  </div>

                  {[
                    ['1', 'Chương', 'Mục tiêu', 'Tiến độ', 'Trạng thái', 'Người phụ trách', 'Ghi chú'],
                    ['2', '1', 'Tổ chức và quản lý', '100%', 'Hoàn thành', 'BS. Lan', 'Đủ hồ sơ'],
                    ['3', '2', 'Tài liệu hệ thống', '85%', 'Đang cập nhật', 'Ths. Hòa', 'Cần kiểm tra'],
                    ['4', '3', 'Nhân sự và đào tạo', '92%', 'Hoàn thành', 'NV. Anh', 'Bản mới'],
                    ['5', '4', 'Trang thiết bị', '78%', 'Cần bổ sung', 'NV. Bảo', 'Đang kiểm định'],
                    ['6', '5', 'Đánh giá nội bộ', '68%', 'Đang rà soát', 'NV. Cường', 'Chưa ký'],
                  ].map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-[52px_repeat(6,minmax(0,1fr))] border-b border-slate-200 text-[13px] text-slate-700 last:border-b-0">
                      {row.map((cell, cellIdx) => {
                        const isSelected = rowIdx === 3 && cellIdx === 3;
                        return (
                          <div
                            key={`${rowIdx}-${cellIdx}`}
                            className={`min-h-[42px] border-r border-slate-200 p-2 ${cellIdx === 0 ? 'bg-slate-50 font-semibold text-slate-500' : ''} ${rowIdx === 0 ? 'bg-slate-100 font-bold text-slate-600' : ''} ${isSelected ? 'bg-[#eaf3ff] text-[#0f3a5b] ring-1 ring-inset ring-[#1677C8]' : ''}`}
                          >
                            {cell}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
