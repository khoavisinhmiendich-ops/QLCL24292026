"use client";
import { useEffect, useState } from "react";
const TZ = "Asia/Ho_Chi_Minh";
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return now;
}
/** Đồng hồ thời gian thực (giờ Việt Nam) */
export function Clock() {
  const now = useNow();
  if (!now) return <div className="h-10 w-44" aria-hidden />;
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: TZ }).format(now);
  const date = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(now);
  return (
    <div className="hidden items-center gap-3 border-r border-slate-200 pr-4 text-right leading-tight xl:flex" title="Giờ Việt Nam (GMT+7)">
      <div><p className="tabular text-[22px] font-bold text-[#0f3b40]">{time}</p><p className="text-[13px] capitalize text-slate-500">{date}</p></div>
    </div>
  );
}
export function Greeting({ name }: { name: string }) {
  const now = useNow();
  const h = now ? Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ }).format(now)) : 8;
  const g = h < 11 ? "Chào buổi sáng" : h < 13 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  return <>{g}, {name}</>;
}
