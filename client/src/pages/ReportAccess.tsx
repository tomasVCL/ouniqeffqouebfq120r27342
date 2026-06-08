import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_DARK = "/vcl-logo-dark.webp";

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
    <div className="h-screen flex overflow-hidden bg-[#F5F0EA]">

      {/* ── Left panel — brand ───────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-12 bg-white border-r border-[#E8E0D8]">
        {/* Logo — full color, no invert */}
        <img src={LOGO_DARK} alt="VCL studio" className="h-8 object-contain object-left" />

        {/* Heading */}
        <div>
          <h2
            className="text-4xl font-black text-[#1B2A33] leading-[1.1]"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            Portal de<br />Clientes
          </h2>
        </div>

        <p className="text-xs text-[#B0A898]">© {new Date().getFullYear()} VCL studio</p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img src={LOGO_DARK} alt="VCL studio" className="h-8 object-contain mx-auto" />
        </div>

        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Title */}
          <div className="w-full mb-8">
            <h1
              className="text-2xl font-black text-[#1B2A33]"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
            >
              Acceder al Portal
            </h1>
            <p className="text-sm text-[#7A8A94] mt-1.5">
              Ingresa la clave proporcionada por VCL studio
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <input
                type="password"
                placeholder="Clave de acceso"
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                disabled={resolvePasskey.isPending}
                className="w-full bg-white border border-[#DDD5CB] text-[#1B2A33] placeholder-[#B0A898] rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:border-[#E8521A] focus:ring-2 focus:ring-[#E8521A]/10 disabled:opacity-50 shadow-sm"
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
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={resolvePasskey.isPending || passkey.length === 0}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: resolvePasskey.isPending ? "#CC4415" : "#E8521A" }}
            >
              {resolvePasskey.isPending ? "Verificando…" : "Acceder al Portal"}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-[#B0A898] mt-6">
            Solo acceso autorizado · Contenido confidencial
          </p>

        </div>
      </div>
    </div>
  );
}
