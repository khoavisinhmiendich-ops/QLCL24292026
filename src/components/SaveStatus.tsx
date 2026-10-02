"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";
type Ctx = { state: SaveState; at: string; set: (s: SaveState) => void };
const C = createContext<Ctx>({ state: "idle", at: "", set: () => {} });
export const useSaveStatus = () => useContext(C);
export function SaveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SaveState>("idle");
  const [at, setAt] = useState("");
  const set = useCallback((s: SaveState) => { setState(s); if (s === "saved") setAt(new Date().toLocaleTimeString("vi-VN")); }, []);
  useEffect(() => { const off = () => set("offline"); window.addEventListener("offline", off); return () => window.removeEventListener("offline", off); }, [set]);
  return <C.Provider value={{ state, at, set }}>{children}</C.Provider>;
}
export function SaveBadge() {
  const { state, at } = useSaveStatus();
  const map = { idle: ["Đã lưu", "bg-slate-100 text-slate-600"], saving: ["Đang lưu...", "bg-amber-100 text-amber-800"], saved: [`Đã lưu lúc ${at}`, "bg-emerald-100 text-emerald-800"], offline: ["Chưa đồng bộ", "bg-orange-100 text-orange-800"], error: ["Lỗi đồng bộ", "bg-red-100 text-red-700"] } as const;
  const [label, cls] = map[state];
  return <span role="status" aria-live="polite" className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
