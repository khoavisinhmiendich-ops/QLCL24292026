import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BackupPanel } from "@/components/BackupPanel";
export const dynamic = "force-dynamic";
export default async function Manage() {
  const s = await getSession();
  if (!s || !can(s.role, "manage")) redirect("/");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { username: true } } } });
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sao lưu &amp; nhật ký hoạt động</h2>
      <BackupPanel canRestore={can(s.role, "admin")} />
      <section><h3 className="mb-2 font-semibold">Nhật ký (100 gần nhất)</h3>
        <table className="w-full rounded-lg border bg-white text-sm"><thead className="bg-slate-100 text-left"><tr><th className="p-2">Thời gian</th><th>Người dùng</th><th>Hành động</th><th>Đối tượng</th></tr></thead>
          <tbody>{logs.map((l) => (<tr key={l.id} className="border-t"><td className="p-2">{l.createdAt.toLocaleString("vi-VN")}</td><td>{l.user?.username ?? "-"}</td><td>{l.action}</td><td className="max-w-md truncate">{l.target}</td></tr>))}</tbody></table>
      </section>
    </div>
  );
}
