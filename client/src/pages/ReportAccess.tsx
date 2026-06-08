import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO  = "/vcl-logo-dark.webp";
const ISOTIPO = "/vcl-isotipo.webp";

export default function ReportAccess() {
  const [passkey, setPasskey] = useState("");
  const [error, setError]     = useState("");
  const [, navigate]          = useLocation();

  const resolvePasskey = trpc.report.resolvePasskey.useMutation({
    onSuccess: (data) => {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("vcl_report_")) sessionStorage.removeItem(k);
      }
      if (data.clientSlug && data.problemId) {
        sessionStorage.setItem(
          `vcl_report_${data.clientSlug}_${data.problemId}`,
          JSON.stringify({ sessionToken: data.sessionToken, projectId: data.projectId })
        );
        navigate(`/${data.clientSlug}/${data.problemId}`);
      } else {
        sessionStorage.setItem(
          `vcl_report_legacy_${data.projectId}`,
          JSON.stringify({ sessionToken: data.sessionToken, projectId: data.projectId })
        );
        navigate(`/client/v2/${data.projectId}`);
      }
    },
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        setError("Clave de acceso inválida. Verifica e intenta de nuevo.");
      } else if ((err.data?.code as string) === "TOO_MANY_REQUESTS") {
        setError("Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.");
      } else {
        setError("Error de conexión. Verifica tu red e intenta de nuevo.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!passkey.trim()) { setError("Ingresa tu clave de acceso."); return; }
    resolvePasskey.mutate({ passkey: passkey.trim() });
  };

  return (
    <>
      {/* ── Keyframe animations ──────────────────────────────────────── */}
      <style>{`
        @keyframes vcl-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-10px) scale(1.02); }
        }
        .vcl-isotipo-anim {
          animation: vcl-float 4s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes vcl-fadein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vcl-fadein     { animation: vcl-fadein 0.5s ease both; }
        .vcl-fadein-d1  { animation: vcl-fadein 0.5s 0.08s ease both; }
        .vcl-fadein-d2  { animation: vcl-fadein 0.5s 0.16s ease both; }
        .vcl-fadein-d3  { animation: vcl-fadein 0.5s 0.24s ease both; }
        .vcl-fadein-d4  { animation: vcl-fadein 0.5s 0.32s ease both; }
      `}</style>

      <div className="h-screen flex overflow-hidden" style={{ background: "#FAF7F3" }}>

        {/* ── Left panel ──────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col items-center justify-between w-[420px] shrink-0 py-14 px-12 bg-white border-r border-[#EDE8E1]">

          {/* Logo top-left */}
          <div className="w-full">
            <img src={LOGO} alt="VCL studio" className="h-7 object-contain object-left" />
          </div>

          {/* Isotipo centrado con animación */}
          <div className="flex flex-col items-center gap-6">
            <img
              src={ISOTIPO}
              alt=""
              className="vcl-isotipo-anim"
              style={{ width: 148, height: "auto" }}
              draggable={false}
            />
            <p
              className="text-[13px] font-semibold tracking-[0.18em] text-[#1B2A33]/40 uppercase"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Portal de Clientes
            </p>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-[#C0B8AE]">© {new Date().getFullYear()} VCL studio</p>
        </div>

        {/* ── Right panel — form ───────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">

          {/* Mobile: logo + isotipo apilados */}
          <div className="lg:hidden flex flex-col items-center gap-4 mb-10">
            <img src={ISOTIPO} alt="" className="vcl-isotipo-anim" style={{ width: 72 }} />
            <img src={LOGO} alt="VCL studio" className="h-6 object-contain" />
          </div>

          <div className="w-full max-w-[340px]">

            {/* Heading */}
            <div className="mb-8 vcl-fadein">
              <h1
                className="text-[28px] font-black text-[#1B2A33] leading-tight"
                style={{ fontFamily: "'Archivo Black', sans-serif" }}
              >
                Acceder al Portal
              </h1>
              <p className="text-sm text-[#8A9AA4] mt-1.5">
                Ingresa la clave proporcionada por VCL studio
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative vcl-fadein-d1">
                <input
                  type="password"
                  placeholder="Clave de acceso"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value)}
                  disabled={resolvePasskey.isPending}
                  className="w-full bg-white border border-[#DDD5CB] text-[#1B2A33] placeholder-[#C0B8AE] rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:border-[#E8521A] focus:ring-2 focus:ring-[#E8521A]/10 disabled:opacity-50 shadow-sm"
                  autoComplete="current-password"
                  autoFocus
                />
                {resolvePasskey.isPending && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#E8521A] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 vcl-fadein">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                </div>
              )}

              <div className="vcl-fadein-d2">
                <button
                  type="submit"
                  disabled={resolvePasskey.isPending || passkey.length === 0}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  style={{ background: resolvePasskey.isPending ? "#CC4415" : "#E8521A" }}
                >
                  {resolvePasskey.isPending ? "Verificando…" : "Acceder al Portal"}
                </button>
              </div>
            </form>

            {/* Footer */}
            <p className="text-center text-[11px] text-[#C0B8AE] mt-7 vcl-fadein-d3">
              Solo acceso autorizado · Contenido confidencial
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
