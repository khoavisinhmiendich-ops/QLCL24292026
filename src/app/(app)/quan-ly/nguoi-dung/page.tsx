import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/PageHeader";
import { UserAdmin } from "@/components/UserAdmin";
export const dynamic = "force-dynamic";
export default async function UsersPage() {
  const s = await getSession();
  if (!s || !can(s.role, "admin")) redirect("/");
  return (<div><PageHeader eyebrow="Quản lý" title="Người dùng & phân quyền" sub="Tạo tài khoản, phân vai trò, khóa/mở khóa và đặt lại pass key" /><UserAdmin currentId={s.uid} /></div>);
}
