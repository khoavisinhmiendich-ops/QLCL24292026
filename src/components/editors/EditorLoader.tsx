"use client";
import dynamic from "next/dynamic";

const Loading = () => <p className="animate-pulse py-20 text-center text-slate-600">Đang tải trình chỉnh sửa...</p>;
const Word = dynamic(() => import("./WordEditor"), { ssr: false, loading: Loading });
const Excel = dynamic(() => import("./ExcelEditor"), { ssr: false, loading: Loading });

export function EditorLoader({ kind, docId, name, docHref }: { kind: "word" | "excel"; docId: string; name: string; docHref: string }) {
  return kind === "word" ? <Word docId={docId} name={name} docHref={docHref} /> : <Excel docId={docId} name={name} docHref={docHref} />;
}
