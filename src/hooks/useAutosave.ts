"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSaveStatus } from "@/components/SaveStatus";

/** Tải dữ liệu từ server, tự lưu có debounce, giữ bản chờ khi mất mạng và đồng bộ lại khi có mạng. */
export function useAutosave<T>(module: string, documentId: string | null, initial: T, delay = 800) {
  const { set } = useSaveStatus();
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<T | null>(null);
  const qs = `module=${encodeURIComponent(module)}${documentId ? `&documentId=${documentId}` : ""}`;

  useEffect(() => {
    let live = true;
    fetch(`/api/module-data?${qs}`).then((r) => r.json()).then((j) => {
      if (!live) return;
      if (j.data) setData(j.data as T);
      version.current = j.version ?? 0; setLoaded(true);
    }).catch(() => { setLoaded(true); set("error"); });
    return () => { live = false; };
  }, [qs, set]);

  const flush = useCallback(async () => {
    if (pending.current === null) return;
    const payload = pending.current;
    set("saving");
    try {
      const r = await fetch("/api/module-data", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ module, documentId, data: payload, baseVersion: version.current }) });
      const j = await r.json();
      if (r.ok) { version.current = j.version; if (pending.current === payload) pending.current = null; set("saved"); }
      else if (r.status === 409) { version.current = j.version; set("error"); }
      else set("error");
    } catch { set(navigator.onLine ? "error" : "offline"); }
  }, [module, documentId, set]);

  const update = useCallback((next: T) => {
    setData(next); pending.current = next;
    clearTimeout(timer.current); timer.current = setTimeout(flush, delay);
  }, [flush, delay]);

  useEffect(() => { const on = () => flush(); window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, [flush]);
  useEffect(() => { const bye = (e: BeforeUnloadEvent) => { if (pending.current !== null) e.preventDefault(); }; window.addEventListener("beforeunload", bye); return () => window.removeEventListener("beforeunload", bye); }, []);
  return { data, update, loaded, retry: flush };
}
