import Link from "next/link";
import { totals, chapters, allDocs, bySection } from "@/lib/docs";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
const Card = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-lg border bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-brand-900">{value}</p></div>
);
export default async function Dashboard() {
  const [entries, lastBackup, recent] = await Promise.all([
    db.moduleData.count().catch(() => 0),
    db.backup.findFirst({ orderBy: { createdAt: "desc" } }).catch(() => null),
    db.auditLog.findMany({ where: { action: "open_document" }, orderBy: { createdAt: "desc" }, take: 8 }).catch(() => []),
  ]);
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tổng quan hệ thống</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <Card label="Chương" value={chapters.length} />
        <Card label="Tổng tài liệu" value={totals.files} />
        <Card label="PDF" value={totals.pdf} />
        <Card label="Word" value={totals.word} />
        <Card label="Excel" value={totals.excel} />
        <Card label="Dữ liệu đã nhập" value={entries} />
      </div>
      <p className="text-sm text-slate-600">Sao lưu gần nhất: {lastBackup ? lastBackup.createdAt.toLocaleString("vi-VN") : "Chưa có"} · Sổ tay: {bySection("handbook").length} · Tài liệu khác: {bySection("other").length}</p>
      <section>
        <h3 className="mb-2 font-semibold">Số tài liệu theo chương</h3>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {chapters.map((c) => (
            <Link key={c.n} href={`/chuong/${c.n}`} className="rounded border bg-white p-3 hover:border-brand-500">
              <p className="text-sm font-medium">Chương {c.n}</p><p className="truncate text-xs text-slate-500">{c.title}</p>
              <p className="mt-1 text-sm">{allDocs.filter((d) => d.sectionOrder === c.n && d.section === "chapter").length} tài liệu</p>
            </Link>
          ))}
        </div>
      </section>
      {recent.length > 0 && (<section><h3 className="mb-2 font-semibold">Mở gần đây</h3><ul className="text-sm text-slate-600">{recent.map((r) => <li key={r.id}>{r.target}</li>)}</ul></section>)}
    </div>
  );
}
