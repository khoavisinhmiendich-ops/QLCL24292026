import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SaveProvider } from "@/components/SaveStatus";
import { AIChat } from "@/components/AIChat";
import { MobileNav } from "@/components/MobileNav";
export const dynamic = "force-dynamic";
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <SaveProvider>
      <div className="flex h-screen">
        <MobileNav><Sidebar role={s.role} mobile /></MobileNav>
        <Sidebar role={s.role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header name={s.name} role={s.role} />
          <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8"><div className="mx-auto max-w-[1600px]">{children}</div></main>
        </div>
      </div>
      <AIChat />
    </SaveProvider>
  );
}
