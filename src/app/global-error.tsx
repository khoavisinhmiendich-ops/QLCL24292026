"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="vi"><body style={{ fontFamily: '"Times New Roman", serif', background: "#f4f8f7", margin: 0 }}>
      <div style={{ maxWidth: 420, margin: "15vh auto", background: "#fff", padding: 32, borderRadius: 16, border: "1px solid #e2e8f0" }} role="alert">
        <h2 style={{ margin: 0, color: "#0f3b40" }}>Hệ thống gặp sự cố</h2>
        <p style={{ color: "#475569" }}>Dữ liệu bạn đã nhập vẫn được giữ nguyên trên máy chủ. Vui lòng thử lại.</p>
        <button onClick={reset} style={{ background: "#0f3b40", color: "#fff", border: 0, padding: "10px 18px", borderRadius: 10, cursor: "pointer" }}>↻ Thử lại</button>
      </div>
    </body></html>
  );
}
