import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-5xl font-semibold text-[#0f3b40]">404</p>
      <p className="mt-2 text-slate-600">Không tìm thấy trang hoặc tài liệu bạn yêu cầu.</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-[#0f3b40] px-5 py-2 font-semibold text-white">Về trang chủ</Link>
    </div>
  );
}
