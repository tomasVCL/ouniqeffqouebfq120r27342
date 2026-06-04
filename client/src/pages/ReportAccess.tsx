import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_DARK = "/vcl-logo-dark.webp";
const ISOTIPO   = "/vcl-isotipo.webp";

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
    <div className="min-h-screen flex" style={{ backgroundColor: "#1B2A33" }}>
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1B2A33 0%, #2C3E4A 60%, #1B2A33 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #E8521A, transparent)" }} />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #E8521A, transparent)" }} />

        <div className="relative z-10">
          <img src={LOGO_DARK} alt="VCL studio" className="h-8 object-contain brightness-0 invert opacity-90" />
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-3">Venture Clienting</p>
            <h2 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              Scouting<br />Intelligence<br />Platform
            </h2>
          </div>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Reportes de análisis estratégico para decisiones de venture clienting basadas en evidencia.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            {["Weighted Scoring Matrix", "Análisis por Cluster", "Recomendaciones del Analista"].map(t => (
              <div key={t} className="flex items-center gap-2.5 text-xs text-white/40">
                <div className="w-1 h-1 rounded-full bg-[#E8521A]" />
                {t}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/20">© {new Date().getFullYear()} VCL studio</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <img src={LOGO_DARK} alt="VCL studio" className="h-10 object-contain brightness-0 invert mx-auto mb-2" />
          <p className="text-xs tracking-[0.25em] uppercase text-white/40">Scouting</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-xs font-bold tracking-[0.25em] text-[#E8521A] uppercase mb-2">Acceso Seguro</p>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              Acceder al Reporte
            </h1>
            <p className="text-sm text-white/40 mt-1.5">Ingresa la clave proporcionada por VCL studio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                placeholder="Clave de acceso"
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                disabled={resolvePasskey.isPending}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-4 py-3.5 text-sm outline-none transition-all focus:border-[#E8521A] focus:bg-white/8 disabled:opacity-50"
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
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-red-400 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={resolvePasskey.isPending || passkey.length === 0}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: resolvePasskey.isPending ? "#CC4415" : "#E8521A" }}
            >
              {resolvePasskey.isPending ? "Verificando…" : "Acceder al Reporte"}
            </button>
          </form>

          <p className="text-center text-xs text-white/20 mt-6">
            Contenido confidencial · Solo acceso autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
