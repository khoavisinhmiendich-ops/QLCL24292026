"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DISPLAY = { fontFamily: "var(--font-display), Georgia, 'Times New Roman', serif" } as const;
const UI = { fontFamily: "var(--font-ui), 'Segoe UI', system-ui, Arial, sans-serif" } as const;
const GRID = {
  backgroundColor: "#0b3036",
  backgroundImage:
    "radial-gradient(ellipse 70% 45% at 30% 8%, rgba(94,234,212,0.18), transparent 70%)," +
    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)," +
    "linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "auto, 44px 44px, 44px 44px",
} as const;

const Svg = ({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{children}</svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setU] = useState("");
  const [passkey, setP] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, passkey }) });
      const j = await r.json();
      if (!r.ok) setErr(j.error ?? "Đăng nhập thất bại"); else { router.replace("/"); router.refresh(); }
    } catch { setErr("Không kết nối được máy chủ. Thử lại."); } finally { setBusy(false); }
  }

  return (
    <main className="flex min-h-screen bg-[#f4f8f7] text-[#12343a]" style={UI}>
      {/* Bên trái: giới thiệu */}
      <section className="relative hidden w-[42%] min-w-[420px] flex-col justify-between p-10 text-white lg:flex" style={GRID}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-teal-200">
            <Svg className="h-5 w-5"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.500-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></Svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">HỆ THỐNG HSCL</p>
            <p className="text-xs font-medium text-teal-300">Khoa Vi sinh – Miễn dịch</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-[40px] font-semibold leading-[1.12]" style={DISPLAY}>Quản lý hồ sơ chất lượng, gọn gàng và an toàn.</h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-teal-100/80">
            Truy cập SOP, quy trình, biểu mẫu và tài liệu hướng dẫn của khoa — chỉnh sửa, lưu tự động và trích xuất PDF ngay trên trình duyệt.
          </p>
          <ul className="mt-8 flex gap-6 text-xs font-semibold text-teal-100">
            <li className="flex items-center gap-1.5"><Svg className="h-3.5 w-3.5"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /></Svg>Word</li>
            <li className="flex items-center gap-1.5"><Svg className="h-3.5 w-3.5"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></Svg>Excel</li>
            <li className="flex items-center gap-1.5"><Svg className="h-3.5 w-3.5"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M9 14h6M9 17h4" /></Svg>PDF</li>
          </ul>
        </div>

        <p className="text-xs font-medium text-teal-200/70">© 2026 Bệnh viện Phong – Da liễu TW Quy Hòa</p>
      </section>

      {/* Bên phải: form đăng nhập */}
      <section className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-[400px] rounded-[28px] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(15,60,66,0.25)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
            <Svg className="h-5 w-5"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></Svg>
          </div>
          <h2 className="mt-5 text-center text-[19px] font-bold uppercase leading-snug tracking-tight text-[#0f3b40]" style={DISPLAY}>
            Hồ sơ quản lý chất lượng<br />QĐ-2429/BYT<br />Khoa Vi sinh - Miễn dịch
          </h2>
          <p className="mt-2 text-center text-xs text-slate-400">Đăng nhập bằng Pass Key được cấp để tiếp tục</p>

          <label htmlFor="u" className="mt-7 block text-[11px] font-bold uppercase tracking-wider text-[#12343a]">Tên đăng nhập</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Svg><circle cx="12" cy="8" r="3.500" /><path d="M5 20c0-3.500 3-6 7-6s7 2.500 7 6" /></Svg></span>
            <input id="u" value={username} onChange={(e) => setU(e.target.value)} autoComplete="username" required placeholder="Nhập tên đăng nhập"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20" />
          </div>

          <label htmlFor="p" className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-[#12343a]">Mật khẩu (Pass Key)</label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Svg><circle cx="8" cy="15" r="3.500" /><path d="M10.500 12.500L19 4m-3 3l2.500 2.500M14 9l2 2" /></Svg></span>
            <input id="p" type={show ? "text" : "password"} value={passkey} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required placeholder="Nhập mật khẩu"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/20" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {show ? <Svg><path d="M3 3l18 18M10.600 10.600a2 2 0 002.800 2.800M9.900 5.100A9.700 9.700 0 0112 5c5 0 8.500 4.500 9.500 7-.4 1-1.200 2.300-2.300 3.400M6.600 6.600C4.500 8 3 10.300 2.500 12c1 2.500 4.500 7 9.500 7 1.400 0 2.700-.3 3.800-.9" /></Svg>
                : <Svg><path d="M2.500 12C3.500 9.500 7 5 12 5s8.500 4.500 9.500 7c-1 2.500-4.500 7-9.500 7s-8.500-4.500-9.500-7z" /><circle cx="12" cy="12" r="3" /></Svg>}
            </button>
          </div>

          {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

          <button disabled={busy} className="mt-6 h-11 w-full rounded-xl bg-[#0f3b40] text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-[#0b2f34] disabled:opacity-60">
            {busy ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center text-[10px] font-semibold text-teal-700">
            © 2026 Khoa Vi sinh - Miễn dịch, Bệnh viện Phong - Da liễu TW Quy Hòa
          </div>
        </form>
      </section>
    </main>
  );
}
