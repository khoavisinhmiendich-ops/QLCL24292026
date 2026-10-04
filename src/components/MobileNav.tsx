"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Menu trượt cho điện thoại/máy tính bảng: nút ☰ + ngăn kéo chứa Sidebar. */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="no-print lg:hidden">
      <button onClick={() => setOpen(true)} aria-label="Mở menu" className="fixed left-3 top-3.5 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-[#0f3b40] shadow-sm">☰</button>
      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-pop h-full w-72 max-w-[85vw] overflow-y-auto bg-[#0b3036]">{children}</div>
          <button className="flex-1 bg-[#0b3036]/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="Đóng menu" />
        </div>
      )}
    </div>
  );
}
