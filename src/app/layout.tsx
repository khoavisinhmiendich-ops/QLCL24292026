import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Quản lý chất lượng 2429.2026", description: "Hệ thống quản lý chất lượng phòng xét nghiệm theo 2429.2026" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="vi"><body>{children}</body></html>);
}
