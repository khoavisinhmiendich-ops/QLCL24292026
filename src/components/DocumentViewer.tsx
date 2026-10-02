"use client";
import { useEffect, useState } from "react";
/** Xem tài liệu gốc: PDF trực tiếp; Word/Excel qua bản PDF dựng bằng LibreOffice để giữ nguyên bố cục. */
export function DocumentViewer({ id, type, name }: { id: string; type: string; name: string }) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [full, setFull] = useState(false);
  const base = `/api/documents/${id}/file`;
  const viewUrl = type === "pdf" || type === "image" ? base : `${base}?variant=preview`;
  const src = `${viewUrl}${viewUrl.includes("?") ? "&" : "?"}r=${nonce}#toolbar=1&navpanes=0`;
  useEffect(() => {
    let live = true;
    fetch(viewUrl, { method: "HEAD", cache: "no-store" }).then((r) => { if (live && !r.ok) setState("error"); }).catch(() => live && setState("error"));
    return () => { live = false; };
  }, [viewUrl, nonce]);
  const reload = () => { setState("loading"); setNonce((n) => n + 1); };
  return (
    <div className={full ? "fixed inset-0 z-50 flex flex-col bg-white" : "flex flex-col"}>
      <div className="no-print flex flex-wrap items-center gap-2 border-b bg-white px-3 py-2 text-sm">
        <button onClick={reload} className="rounded border px-3 py-1 hover:bg-slate-50">↻ TẢI LẠI</button>
        <a className="rounded border px-3 py-1 hover:bg-slate-50" href={base} target="_blank" rel="noreferrer">MỞ FILE GỐC</a>
        <a className="rounded border px-3 py-1 hover:bg-slate-50" href={`${base}?download=1`}>Tải xuống</a>
        {type !== "pdf" && type !== "image" && <a className="rounded border px-3 py-1 hover:bg-slate-50" href={`${base}?variant=preview&download=1`}>Tải bản PDF</a>}
        <button onClick={() => setFull(!full)} className="rounded border px-3 py-1 hover:bg-slate-50">{full ? "Thu nhỏ" : "Toàn màn hình"}</button>
        <span className="ml-auto truncate text-xs text-slate-500">{name}</span>
      </div>
      <div className={`relative bg-slate-200 ${full ? "flex-1" : "h-[78vh]"}`}>
        {state === "loading" && <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-600">Đang tải tài liệu...</p>}
        {state === "error" ? (
          <div className="flex h-full flex-col items-center justify-center gap-3" role="alert">
            <p className="font-medium">Không thể hiển thị tài liệu</p>
            <div className="flex gap-2"><button onClick={reload} className="rounded bg-brand-600 px-4 py-2 text-white">↻ TẢI LẠI</button><a href={base} target="_blank" rel="noreferrer" className="rounded border bg-white px-4 py-2">MỞ FILE GỐC</a></div>
          </div>
        ) : type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} onLoad={() => setState("ok")} onError={() => setState("error")} className="mx-auto max-h-full" />
        ) : (
          <iframe key={nonce} title={name} src={src} onLoad={() => setState("ok")} onError={() => setState("error")} className="h-full w-full border-0" />
        )}
      </div>
    </div>
  );
}
