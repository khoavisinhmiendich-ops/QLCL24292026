"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="m-10 max-w-md rounded-lg border bg-white p-6 shadow-sm" role="alert">
      <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
      <p className="mt-2 text-sm text-slate-600">Dữ liệu của bạn vẫn được giữ nguyên. Vui lòng thử lại.</p>
      <button onClick={reset} className="mt-4 rounded bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">↻ Thử lại</button>
    </div>
  );
}
