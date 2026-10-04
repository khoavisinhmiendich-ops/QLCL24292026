"use client";
import { useCallback, useEffect, useState } from "react";

/** Xem tài liệu gốc: PDF trực tiếp; Word/Excel qua bản PDF dựng bằng LibreOffice để giữ nguyên bố cục. */
export function DocumentViewer({ id, type, name }: { id: string; type: string; name: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [nonce, setNonce] = useState(0);
  const base = `/api/documents/${id}/file`;
  const viewUrl = type === "pdf" || type === "image" ? base : `${base}?variant=preview`;

  useEffect(() => {
    let live = true; let created: string | null = null;
    setState("loading"); setBlobUrl(null);
    fetch(viewUrl, { cache: nonce ? "reload" : "default" })
      .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
      .then((b) => { if (!live) return; created = URL.createObjectURL(b); setBlobUrl(created); setState("ok"); })
      .catch(() => { if (live) setState("error"); });
    return () => { live = false; if (created) URL.revokeObjectURL(created); };
  }, [viewUrl, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const btn = "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#12343a] transition hover:border-teal-400 hover:bg-teal-50";
  return (
    <div className={full ? "fixed inset-0 z-50 flex flex-col bg-white" : "flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"}>
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
        <button onClick={reload} className={btn}>↻ TẢI LẠI</button>
        <a className={btn} href={base} target="_blank" rel="noreferrer">MỞ FILE GỐC</a>
        <a className={btn} href={`${base}?download=1`}>Tải xuống</a>
        {type !== "pdf" && type !== "image" && <a className={btn} href={`${base}?variant=preview&download=1`}>Tải bản PDF</a>}
        <button onClick={() => setFull(!full)} className={btn}>{full ? "Thu nhỏ" : "Toàn màn hình"}</button>
        <span className="ml-auto max-w-xs truncate text-xs text-slate-500">{name}</span>
      </div>
      <div className={`relative bg-slate-200 ${full ? "flex-1" : "h-[78vh]"}`}>
        {state === "loading" && <p className="absolute inset-0 flex animate-pulse items-center justify-center text-sm text-slate-600">Đang tải tài liệu...</p>}
        {state === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-3" role="alert">
            <p className="font-medium">Không thể hiển thị tài liệu</p>
            <div className="flex gap-2"><button onClick={reload} className="rounded-lg bg-[#0f3b40] px-4 py-2 text-white">↻ TẢI LẠI</button><a href={base} target="_blank" rel="noreferrer" className="rounded-lg border bg-white px-4 py-2">MỞ FILE GỐC</a></div>
          </div>
        )}
        {state === "ok" && blobUrl && (type === "image"
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={blobUrl} alt={name} className="mx-auto max-h-full" />
          : <iframe title={name} src={`${blobUrl}#toolbar=1&navpanes=0`} className="h-full w-full border-0" />)}
      </div>
    </div>
  );
}
