import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const VCL_LOGO_DARK = "/vcl-logo-dark.webp";

export default function ReportAccess() {
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const resolvePasskey = trpc.report.resolvePasskey.useMutation({
    onSuccess: (data) => {
      // Clear stale session entries
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("vcl_report_")) sessionStorage.removeItem(k);
      }
      // Store the JWT session token — NOT the plaintext passkey
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
    if (!passkey.trim()) {
      setError("Ingresa tu clave de acceso.");
      return;
    }
    resolvePasskey.mutate({ passkey: passkey.trim() });
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center" style={{ backgroundColor: "#FDF6EE" }}>
      <div className="mb-8 flex flex-col items-center gap-2">
        <img src={VCL_LOGO_DARK} alt="VCL studio" className="h-8 object-contain" style={{ height: "128px", width: "128px" }} />
        <span className="text-sm tracking-widest uppercase" style={{ color: "#6B6B6B", letterSpacing: "0.18em" }}>
          Scouting
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg px-10 py-10 w-full max-w-md flex flex-col items-center gap-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FDE8DC" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E8521A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Acceso al Reporte</h1>
          <p className="text-sm text-gray-500">Ingresa la clave de acceso proporcionada por VCL studio</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            placeholder="Clave de acceso"
            value={passkey}
            onChange={(e) => setPasskey(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 transition-all"
            style={{ focusRingColor: "#E8521A" } as React.CSSProperties}
            onFocus={(e) => (e.target.style.borderColor = "#E8521A")}
            onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
            autoComplete="current-password"
          />

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={resolvePasskey.isPending}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-all active:scale-[0.97]"
            style={{
              backgroundColor: resolvePasskey.isPending ? "#E8A090" : "#E8521A",
              cursor: resolvePasskey.isPending ? "not-allowed" : "pointer",
            }}
          >
            {resolvePasskey.isPending ? "Verificando..." : "Acceder al Reporte"}
          </button>
        </form>
      </div>
    </div>
  );
}
