"use client";
import { useCallback, useEffect, useState } from "react";

/** Xem tài liệu gốc: PDF trực tiếp; Word/Excel qua bản PDF dựng bằng LibreOffice để giữ nguyên bố cục. */
export function DocumentViewer({ id, type, name }: { id: string; type: string; name: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [nonce, setNonce] = useState(0);
  const base = `/api/documents/${id}/file`;
  const isOffice = type === "word" || type === "excel";
  const viewUrl = type === "pdf" || type === "image" ? base : `${base}?variant=preview`;

  useEffect(() => {
    let live = true; let created: string | null = null;
    setState("loading"); setBlobUrl(null);
    if (isOffice) {
      fetch(viewUrl, { cache: nonce ? "reload" : "default" })
        .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
        .then((b) => { if (!live) return; created = URL.createObjectURL(b); setBlobUrl(created); setState("ok"); })
        .catch(() => { if (live) setState("error"); });
    } else {
      fetch(viewUrl, { cache: nonce ? "reload" : "default" })
        .then(async (r) => { if (!r.ok) throw new Error(String(r.status)); return r.blob(); })
        .then((b) => { if (!live) return; created = URL.createObjectURL(b); setBlobUrl(created); setState("ok"); })
        .catch(() => { if (live) setState("error"); });
    }
    return () => { live = false; if (created) URL.revokeObjectURL(created); };
  }, [viewUrl, nonce, isOffice]);

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
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-white px-6 text-center" role="alert">
            <p className="text-lg font-semibold text-[#12343a]">Không thể hiển thị bản xem trước</p>
            <p className="max-w-md text-sm text-slate-600">
              {isOffice ? "Bản PDF xem trước chưa được tạo cho file Word/Excel này. Bạn có thể mở file gốc hoặc tải xuống để xem trên ứng dụng Office." : "Tệp đang không khả dụng hoặc chưa sẵn sàng để render."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={reload} className="rounded-lg bg-[#0f3b40] px-4 py-2 text-white">↻ TẢI LẠI</button>
              <a href={base} target="_blank" rel="noreferrer" className="rounded-lg border bg-white px-4 py-2 text-[#12343a]">MỞ FILE GỐC</a>
              <a href={`${base}?download=1`} className="rounded-lg border bg-white px-4 py-2 text-[#12343a]">TẢI XUỐNG</a>
            </div>
          </div>
        )}
        {state === "ok" && blobUrl && (type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={blobUrl} alt={name} className="mx-auto max-h-full" />
        ) : isOffice ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-white px-6 text-center">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tài liệu Office</p>
              <p className="mt-2 text-xl font-semibold text-[#12343a]">Mở trực tiếp bằng ứng dụng Office</p>
              <p className="mt-2 max-w-md text-sm text-slate-600">Tệp Word hoặc Excel không hiển thị trực tiếp trong trình duyệt. Bạn có thể mở file gốc hoặc tải xuống để xem trên máy.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <a href={base} target="_blank" rel="noreferrer" className="rounded-lg bg-[#0f3b40] px-4 py-2 text-white">MỞ FILE GỐC</a>
              <a href={`${base}?download=1`} className="rounded-lg border bg-white px-4 py-2 text-[#12343a]">TẢI XUỐNG</a>
            </div>
          </div>
        ) : (
          <iframe title={name} src={`${blobUrl}#toolbar=1&navpanes=0`} className="h-full w-full border-0" />
        ))}
      </div>
    </div>
  );
}
