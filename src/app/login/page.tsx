"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const UI = {
  fontFamily: "'Segoe UI', Inter, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
} as const;

const Svg = ({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

export default function LoginPage() {
  const router = useRouter();

  const [username, setU] = useState("");
  const [passkey, setP] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passkey }),
      });

      const j = await r.json();

      if (!r.ok) {
        setErr(j.error ?? "Đăng nhập thất bại");
      } else {
        router.replace("/");
        router.refresh();
      }
    } catch {
      setErr("Không kết nối được máy chủ. Thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-[#f5f8fc] text-[#13263d]"
      style={UI}
    >
      <div className="flex min-h-screen">

        {/* =========================================================
            LEFT BRAND PANEL
        ========================================================== */}
        <section
          className="
            relative hidden min-h-screen overflow-hidden
            lg:flex lg:w-[54%] lg:flex-col
            bg-[#09243f] text-white
          "
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#1677b8]/20 blur-3xl" />
            <div className="absolute -bottom-32 right-[-100px] h-[500px] w-[500px] rounded-full bg-[#12a6a6]/10 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.045]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex min-h-screen flex-col px-12 py-10 xl:px-16">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-[14px]
                  border border-white/15
                  bg-[#1478b9]
                  shadow-[0_10px_30px_rgba(0,0,0,.18)]
                "
              >
                <span className="text-sm font-extrabold tracking-tight">
                  QL
                </span>
              </div>

              <div>
                <div className="text-[14px] font-bold tracking-wide text-white">
                  QUẢN LÝ CHẤT LƯỢNG
                </div>

                <div className="mt-0.5 text-[11px] font-medium text-[#8fcfe1]">
                  Khoa Vi sinh - Miễn dịch
                </div>
              </div>
            </div>

            {/* Main introduction */}
            <div className="flex flex-1 items-center">
              <div className="max-w-[650px]">

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#35c5c5] shadow-[0_0_12px_rgba(53,197,197,.7)]" />
                  <span className="text-[11px] font-semibold tracking-wide text-[#b8dce6]">
                    MEDICAL LABORATORY QUALITY SYSTEM
                  </span>
                </div>

                <h1 className="text-[46px] font-bold leading-[1.08] tracking-[-1.5px] text-white xl:text-[54px]">
                  Quản lý chất lượng
                  <br />
                  <span className="text-[#65c6d6]">
                    2429.2026
                  </span>
                </h1>

                <p className="mt-7 max-w-[560px] text-[15px] leading-7 text-[#b9cad8]">
                  Hệ thống quản lý hồ sơ chất lượng dành cho phòng xét nghiệm,
                  hỗ trợ quản lý tài liệu, biểu mẫu, dữ liệu và quy trình
                  nghiệp vụ trên một nền tảng tập trung.
                </p>

                {/* Feature cards */}
                <div className="mt-9 grid max-w-[610px] grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1478b9]/30 text-[#70cce1]">
                      <Svg className="h-[18px] w-[18px]">
                        <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                        <path d="M14 3v5h5" />
                        <path d="M8 12h8M8 16h6" />
                      </Svg>
                    </div>

                    <div className="text-[13px] font-bold text-white">
                      Quản lý tài liệu
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-[#91aabb]">
                      Word, Excel, PDF và hồ sơ chất lượng.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f9b9b]/20 text-[#64d2d2]">
                      <Svg className="h-[18px] w-[18px]">
                        <path d="M12 3v18" />
                        <path d="M5 8l7-5 7 5" />
                        <path d="M5 16l7 5 7-5" />
                      </Svg>
                    </div>

                    <div className="text-[13px] font-bold text-white">
                      Dữ liệu tập trung
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-[#91aabb]">
                      Lưu trữ và quản lý dữ liệu an toàn.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#1478b9]/30 text-[#70cce1]">
                      <Svg className="h-[18px] w-[18px]">
                        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                        <path d="M9 12l2 2 4-4" />
                      </Svg>
                    </div>

                    <div className="text-[13px] font-bold text-white">
                      Kiểm soát truy cập
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-[#91aabb]">
                      Phân quyền và bảo vệ thông tin hệ thống.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f9b9b]/20 text-[#64d2d2]">
                      <Svg className="h-[18px] w-[18px]">
                        <path d="M4 4h16v16H4z" />
                        <path d="M8 8h8M8 12h8M8 16h5" />
                      </Svg>
                    </div>

                    <div className="text-[13px] font-bold text-white">
                      Xuất báo cáo
                    </div>

                    <div className="mt-1 text-[11px] leading-5 text-[#91aabb]">
                      Hỗ trợ các biểu mẫu và báo cáo nghiệp vụ.
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between border-t border-white/10 pt-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#7892a6]">
                  Medical Laboratory
                </div>

                <div className="mt-1 text-[11px] text-[#9bb0bf]">
                  Khoa Vi sinh - Miễn dịch
                </div>
              </div>

              <div className="text-right text-[10px] text-[#7892a6]">
                © 2026
                <br />
                QLCL 2429.2026
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================
            RIGHT LOGIN PANEL
        ========================================================== */}
        <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-8 sm:px-8">

          <div className="w-full max-w-[450px]">

            {/* Mobile brand */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#146fb0] text-sm font-extrabold text-white shadow-lg">
                QL
              </div>

              <div>
                <div className="text-sm font-bold text-[#102a43]">
                  QUẢN LÝ CHẤT LƯỢNG
                </div>

                <div className="text-[11px] text-[#6f8497]">
                  Khoa Vi sinh - Miễn dịch
                </div>
              </div>
            </div>

            {/* Login Card */}
            <form
              onSubmit={submit}
              className="
                overflow-hidden rounded-[22px]
                border border-[#dfe7ef]
                bg-white
                shadow-[0_24px_70px_rgba(19,50,76,.10)]
              "
            >

              {/* Card header */}
              <div className="border-b border-[#edf1f5] px-7 pb-6 pt-8 sm:px-9">

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf5fb] text-[#1475b4]">
                    <Svg className="h-[21px] w-[21px]">
                      <rect x="5" y="10" width="14" height="10" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      <circle cx="12" cy="15" r="1" />
                    </Svg>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#1674b1]">
                      Secure Access
                    </div>

                    <div className="mt-0.5 text-[11px] text-[#91a0ae]">
                      Hệ thống quản lý chất lượng
                    </div>
                  </div>
                </div>

                <h2 className="mt-7 text-[28px] font-bold tracking-[-.5px] text-[#102a43]">
                  Đăng nhập
                </h2>

                <p className="mt-2 text-[13px] leading-5 text-[#728397]">
                  Đăng nhập bằng tài khoản và Pass Key được cấp để tiếp tục.
                </p>

              </div>

              {/* Form */}
              <div className="px-7 py-7 sm:px-9">

                {/* Username */}
                <div>
                  <label
                    htmlFor="u"
                    className="mb-2 block text-[12px] font-semibold text-[#30465c]"
                  >
                    Tên đăng nhập
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8295a8]">
                      <Svg className="h-[18px] w-[18px]">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
                      </Svg>
                    </span>

                    <input
                      id="u"
                      value={username}
                      onChange={(e) => setU(e.target.value)}
                      autoComplete="username"
                      required
                      placeholder="Nhập tên đăng nhập"
                      className="
                        h-[50px] w-full rounded-xl
                        border border-[#d8e2eb]
                        bg-[#f8fafc]
                        pl-11 pr-4
                        text-[13px] text-[#182d42]
                        outline-none
                        transition-all duration-200
                        placeholder:text-[#a0adba]
                        hover:border-[#b9c9d7]
                        focus:border-[#1680bd]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#1680bd]/10
                      "
                    />
                  </div>
                </div>

                {/* Pass Key */}
                <div className="mt-5">
                  <label
                    htmlFor="p"
                    className="mb-2 block text-[12px] font-semibold text-[#30465c]"
                  >
                    Pass Key
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8295a8]">
                      <Svg className="h-[18px] w-[18px]">
                        <circle cx="8" cy="15" r="3.5" />
                        <path d="M10.5 12.5L19 4m-3 3 2.5 2.5M14 9l2 2" />
                      </Svg>
                    </span>

                    <input
                      id="p"
                      type={show ? "text" : "password"}
                      value={passkey}
                      onChange={(e) => setP(e.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="Nhập Pass Key"
                      className="
                        h-[50px] w-full rounded-xl
                        border border-[#d8e2eb]
                        bg-[#f8fafc]
                        pl-11 pr-12
                        text-[13px] text-[#182d42]
                        outline-none
                        transition-all duration-200
                        placeholder:text-[#a0adba]
                        hover:border-[#b9c9d7]
                        focus:border-[#1680bd]
                        focus:bg-white
                        focus:ring-4
                        focus:ring-[#1680bd]/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={
                        show ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      className="
                        absolute right-3 top-1/2
                        -translate-y-1/2
                        rounded-lg p-1.5
                        text-[#8295a8]
                        transition
                        hover:bg-[#edf4f8]
                        hover:text-[#35627d]
                      "
                    >
                      {show ? (
                        <Svg className="h-[18px] w-[18px]">
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.1A9.7 9.7 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.3-2.3 3.4" />
                          <path d="M6.6 6.6C4.5 8 3 10.3 2.5 12c1 2.5 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.9" />
                        </Svg>
                      ) : (
                        <Svg className="h-[18px] w-[18px]">
                          <path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" />
                          <circle cx="12" cy="12" r="3" />
                        </Svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {err && (
                  <div
                    role="alert"
                    className="
                      mt-4 flex items-start gap-2.5
                      rounded-xl border border-red-100
                      bg-red-50 px-3.5 py-3
                      text-[12px] leading-5 text-red-700
                    "
                  >
                    <Svg className="mt-0.5 h-4 w-4 shrink-0">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16h.01" />
                    </Svg>

                    <span>{err}</span>
                  </div>
                )}

                {/* Login button */}
                <button
                  type="submit"
                  disabled={busy}
                  className="
                    mt-6 flex h-[50px] w-full
                    items-center justify-center
                    rounded-xl
                    bg-[#126fb0]
                    text-[13px] font-bold
                    tracking-wide text-white
                    shadow-[0_8px_20px_rgba(18,111,176,.20)]
                    transition-all duration-200
                    hover:bg-[#0d609b]
                    hover:shadow-[0_10px_25px_rgba(18,111,176,.25)]
                    active:scale-[.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    disabled:shadow-none
                  "
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Đang đăng nhập...
                    </span>
                  ) : (
                    <>
                      Đăng nhập
                      <Svg className="ml-2 h-4 w-4">
                        <path d="M5 12h14" />
                        <path d="m13 6 6 6-6 6" />
                      </Svg>
                    </>
                  )}
                </button>

              </div>

              {/* Footer */}
              <div className="border-t border-[#edf1f5] bg-[#fbfcfd] px-7 py-4 text-center sm:px-9">
                <div className="text-[10px] font-medium leading-5 text-[#8393a2]">
                  © 2026 Khoa Vi sinh - Miễn dịch
                  <span className="mx-1.5 text-[#c3cbd2]">•</span>
                  Bệnh viện Phong - Da liễu TW Quy Hòa
                </div>
              </div>

            </form>

            {/* Security note */}
            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#8999a8]">
              <Svg className="h-3.5 w-3.5">
                <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
                <path d="M9 12l2 2 4-4" />
              </Svg>

              <span>Truy cập được bảo vệ bằng xác thực tài khoản</span>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}