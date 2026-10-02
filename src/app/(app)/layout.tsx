import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SaveProvider } from "@/components/SaveStatus";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <SaveProvider>
      <div className="flex h-screen flex-col">
        <Header name={s.name} role={s.role} />
        <div className="flex min-h-0 flex-1"><Sidebar role={s.role} /><main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main></div>
      </div>
    </SaveProvider>
  );
}
