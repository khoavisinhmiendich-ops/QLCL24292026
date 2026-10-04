"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function NavLink({ href, className = "", activeClassName = "", title, children }: { href: string; className?: string; activeClassName?: string; title?: string; children: React.ReactNode }) {
  const p = usePathname();
  const active = href === "/" ? p === "/" : p === href || p.startsWith(href + "/");
  return <Link href={href} title={title} aria-current={active ? "page" : undefined} className={`${className} ${active ? activeClassName : ""}`}>{children}</Link>;
}
