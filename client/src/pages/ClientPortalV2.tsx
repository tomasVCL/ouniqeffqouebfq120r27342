import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";

// ── Assets ─────────────────────────────────────────────────────────────────
const LOGO_DARK = "/vcl-logo-dark.webp";
const ISOTIPO   = "/vcl-isotipo.webp";

// ── Startup logos ─────────────────────────────────────────────────────────
const GF = (d: string) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${d}&size=128`;
const STARTUP_LOGOS: Record<string, string> = {
  // Purdy — local files
  "CAFU":          "/logos/purdy/cafu.png",
  "Spiffy":        "/logos/purdy/spiffy.png",
  "Smartcar":      "/logos/purdy/smartcar.png",
  "Mojio":         "/logos/purdy/mojio.png",
  "Sibros":        "/logos/purdy/sibros.png",
  "Vinli":         "/logos/purdy/vinli.png",
  "Open Loyalty":  "/logos/purdy/open-loyalty.png",
  "EasyRewardz":   "/logos/purdy/easyrewardz.png",
  "Antavo":        "/logos/purdy/antavo.png",
  "Orbee":         "/logos/purdy/orbee.png",
  "Impel AI":      "/logos/purdy/impelai.png",
  "myKaarma":      "/logos/purdy/mykaarma.png",
  // BAC — external
  "DispatchTrack": "https://www.suiteapp.com/SSP%20Applications/SDN%20SuiteApp.com/suiteappcom/img/items/DispatchTrack_01.png",
  "FarEye":        "https://play-lh.googleusercontent.com/bCIYElymG0CA07n2SaifOctjueJDotL9rRZJOHqCpnnQgSVdimmrbsvCcx3QsnvV4AY",
  "Bringg":        "https://play-lh.googleusercontent.com/tyZZHZuenzCd730izQcp96k_Tg7Mc_SM1H1FARzf-sHUq4Ms4jojPO0-KlI4XL2jS6w=w600-h300-pc0xffffff-pd",
  "Wise Systems":  "https://media.licdn.com/dms/image/v2/C560BAQENp5DGJh3utA/company-logo_200_200/company-logo_200_200/0/1630613990712/wise_systems___logistics_solutions_logo?e=2147483647&v=beta&t=AilRw1KD3G4X-fy0KxUhsuohdbNhRs7HqQmv5IVFX-I",
  "Routific":      "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/vefax3wsfjg8ydqskhz3?ik-sanitizeSvg=true",
  "SimpliRoute":   "https://play-lh.googleusercontent.com/F9kPDYF3A-xiDehoNAfhxW4igJUbxMq6GvxPhOVzH2DaJP62qvyU1qgClPDx-BphZg",
  "OneRail":       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgwHGgbBdZraSLTxwolSV6k2eBPIT8eKwDbA&s",
  "SmartQuick":    "https://play-lh.googleusercontent.com/pRXOW0UOd1LI-gfGR6hv0q1ZsYO6noZ95giA2aoYAWJce8qA8NgzRcJSejLRVc6xDpU",
  "Moova":         "https://play-lh.googleusercontent.com/Zn5mVyfgY0zWuH7s5GT2NDXaNIMTYWXPEDKWMPU4yAY27LT5RnJ-Y3OVvDFyPgOKP_s",
  "Mienvío":       "https://pbs.twimg.com/profile_images/1494125766656856065/hE1CLRVg_400x400.jpg",
  "Cubbo":         "https://i.tracxn.com/logo/company/cubbo.com_Logo_bfde9e3b-bce2-40e4-b56b-aadd56d6b608.jpg",
  "Ravent":        "/ravent-logo.jpg",
  // CoopeAnde — local files
  "DigiVentures":  "/logos/coopeande/digiventures.png",
  "Truora":        "/logos/coopeande/truora.jpg",
  "Docuten":       "/logos/coopeande/docuten.png",
  "VaFirma":       "/logos/coopeande/vafirma.png",
  "Veridas":       GF("veridas.com"),
  "Tecalis":       "/logos/coopeande/tecalis.png",
  "Mifiel":        "/logos/coopeande/mifiel.png",
  "Weetrust":      "/logos/coopeande/weetrust.png",
  "Incode":        "/logos/coopeande/incode.png",
  "Signzy":        "/logos/coopeande/signzy.png",
  "Firmamex":      "/logos/coopeande/firmamex.png",
  // ITC
  "EcoVadis":      "https://ecovadis.com/wp-content/uploads/2026/05/revamp-logo.svg",
  "TrusTrace":     GF("trustrace.com"),
  "osapiens":      GF("osapiens.com"),
  "Fairly Made":   GF("fairlymade.com"),
  "Carbonfact":    "https://www.carbonfact.com/hubfs/carbon_fact_2025/Images/logo.svg",
  "Kezzler":       "https://kezzler.com/wp-content/uploads/2020/12/kezzler-logo-dark.svg",
  "Myneral Labs":  "https://cdn.prod.website-files.com/6995839b9012af59defecb0f/6995839c9012af59defeccd7_Company%20logo.svg",
  "Ecochain":      GF("ecochain.com"),
  "Circularise":   "https://www.circularise.com/assets/icons/circularise-logo-dark.svg",
  "Carbon Trail":  GF("carbontrail.net"),
};

// ── Tier config ───────────────────────────────────────────────────────────
// TOP PICK siempre es UNA SOLA startup (la #1 con mayor puntuación).
// STRONG / VIABLE / MONITOR son rangos de puntaje sobre escala 0–10.
const TIERS: Record<number, { label: string; color: string; bg: string; text: string; border: string; rule: string }> = {
  1: { label: "TOP PICK", color: "#059669", bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7", rule: "Startup #1, mayor puntaje" },
  2: { label: "STRONG",   color: "#2563EB", bg: "#DBEAFE", text: "#1E3A8A", border: "#93C5FD", rule: "Puntaje > 7.5" },
  3: { label: "VIABLE",   color: "#D97706", bg: "#FEF3C7", text: "#92400E", border: "#FCD34D", rule: "Puntaje 4.5 – 6.9" },
  4: { label: "MONITOR",  color: "#DC2626", bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5", rule: "Las 2 últimas del ranking" },
};

// Tier por posición + puntaje. La #1 siempre es TOP PICK; las 2 últimas siempre
// MONITOR; el resto por rango de puntaje.
function computeTier(rank: number, score10: number, total?: number): number {
  if (rank === 1) return 1;
  if (total != null && total >= 4 && rank > total - 2) return 4; // bottom 2 → MONITOR
  if (score10 > 7.5) return 2;
  if (score10 >= 4.5) return 3;
  return 4;
}

// Fecha sin "de": "20 de mayo de 2026" → "20 mayo 2026"
function fmtDate(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\s+de\s+/gi, " ").trim();
}
const SCORE_STYLES: Record<number, { bg: string; text: string; bar: string }> = {
  0: { bg: "#F5F4F1", text: "#9CA3AF", bar: "#D1D5DB" },
  1: { bg: "#FEF2F2", text: "#B91C1C", bar: "#F87171" },
  2: { bg: "#FFFBEB", text: "#92400E", bar: "#FCD34D" },
  3: { bg: "#EFF6FF", text: "#1D4ED8", bar: "#93C5FD" },
  4: { bg: "#ECFDF5", text: "#065F46", bar: "#34D399" },
};

// ── Loading messages ──────────────────────────────────────────────────────
const LOADING_MSGS = [
  "Cargando análisis…",
  "Procesando resultados…",
  "Preparando el reporte…",
  "Casi listo…",
];

// ── Page transition variants ──────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ── Criterion header with description tooltip ────────────────────────────
function CriterionHeader({ req }: { req: any }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const short = req.name.length > 15 ? req.name.slice(0, 13) + "…" : req.name;
  return (
    <div className="relative cursor-default"
      onMouseEnter={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.bottom });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}>
      <span className="text-[10px] font-semibold text-white/80 leading-tight block text-center whitespace-normal break-words max-w-[72px] mx-auto">{short}</span>
      <span className="text-[9px] font-bold text-[#E8521A] block text-center mt-0.5">{(req.weight * 100).toFixed(0)}%</span>
      {show && (
        <div className="fixed z-50 pointer-events-none"
          style={{ left: Math.min(Math.max(pos.x - 130, 8), window.innerWidth - 280), top: pos.y + 6 }}>
          <div className="bg-[#1B2A33] text-white text-xs rounded-xl px-4 py-3 shadow-2xl max-w-[260px] leading-relaxed">
            <p className="font-bold mb-1">{req.name}</p>
            {req.description && <p className="text-white/70">{req.description}</p>}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1B2A33] rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score tooltip ─────────────────────────────────────────────────────────
function ScoreTooltip({ children, rationale }: { children: React.ReactNode; rationale?: string | null }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: r.left + r.width / 2, y: r.top });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && rationale && (
        <div className="fixed z-50 pointer-events-none"
          style={{ left: Math.min(pos.x - 130, window.innerWidth - 280), top: pos.y - 12, transform: "translateY(-100%)" }}>
          <div className="bg-[#1B2A33] text-white text-xs rounded-xl px-4 py-3 shadow-2xl max-w-[260px] leading-relaxed">
            {rationale}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1B2A33] rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Startup hover card ────────────────────────────────────────────────────
function StartupName({ startup }: { startup: any }) {
  const [show, setShow] = useState(false);
  const [pos, setPos]   = useState({ x: 0, y: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const clear = () => { if (timer.current) clearTimeout(timer.current); };
  const hide  = () => { clear(); timer.current = setTimeout(() => setShow(false), 120); };

  const trigger = (e: React.MouseEvent) => {
    clear();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: r.left, y: r.bottom });
    setShow(true);
  };

  const nameEl = (
    <span className="text-base font-bold text-[#1B2A33] hover:text-[#E8521A] transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
      onMouseEnter={trigger} onMouseLeave={hide}>
      {startup.name}
    </span>
  );

  return (
    <span className="relative">
      {startup.websiteUrl ? <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer">{nameEl}</a> : nameEl}
      {show && createPortal(
        <div className="fixed z-[9999] bg-white border border-[#E2D9CF] rounded-2xl shadow-2xl p-5 w-72"
          style={{ left: Math.min(pos.x, window.innerWidth - 300), top: pos.y + 6 }}
          onMouseEnter={clear} onMouseLeave={hide}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-bold text-[#1B2A33] text-sm">{startup.name}</p>
              {startup.description && <p className="text-xs text-[#6B7A84] mt-0.5 leading-relaxed">{startup.description}</p>}
            </div>
            {startup.foundedYear && (
              <span className="shrink-0 text-xs bg-[#FDF6EE] border border-[#E2D9CF] text-[#6B7A84] rounded-lg px-2 py-1">{startup.foundedYear}</span>
            )}
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 text-xs">
            {startup.hqCity && <><span className="text-[#9BA8B0]">HQ</span><span className="text-[#1B2A33]">{startup.hqCity}, {startup.hqCountry}</span></>}
            {startup.employeeRange && <><span className="text-[#9BA8B0]">Empleados</span><span className="text-[#1B2A33]">{startup.employeeRange}</span></>}
            {startup.fundingStage && <><span className="text-[#9BA8B0]">Etapa</span><span className="text-[#1B2A33]">{startup.fundingStage}</span></>}
            {startup.fundingAmount && <><span className="text-[#9BA8B0]">Fondos</span><span className="text-[#1B2A33]">{startup.fundingAmount}</span></>}
            {startup.clientsRef && <><span className="text-[#9BA8B0]">Clientes</span><span className="text-[#1B2A33]">{startup.clientsRef}</span></>}
            {startup.investors && <><span className="text-[#9BA8B0]">Inversores</span><span className="text-[#1B2A33]">{startup.investors}</span></>}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}

// ── Shared header ─────────────────────────────────────────────────────────
function PortalHeader({ project }: { project: any }) {
  return (
    <div className="bg-white border-b border-[#E2D9CF]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
        <div className="flex items-center justify-between">
          <img src={LOGO_DARK} alt="VCL studio" className="h-9 object-contain" />
          {project.clientLogoUrl && (
            <img
              src={project.clientLogoUrl}
              alt={project.clientName}
              className="object-contain"
              style={{ height: "40px", width: "auto", maxWidth: "220px" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE 1 — CONTEXTO
// ══════════════════════════════════════════════════════════════════════════
function PageContext({ data, onNext }: { data: any; onNext: () => void }) {
  const { project, requirements } = data;
  const indispensable = requirements.filter((r: any) => r.mandatory);
  const deseable = requirements.filter((r: any) => !r.mandatory);
  const sorted = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={project} />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-18">
        <div className="grid lg:grid-cols-[1fr_260px] gap-10 items-start">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-4">Reporte de Scouting</p>
            <h1 className="text-4xl lg:text-5xl font-black text-[#1B2A33] leading-[1.05] tracking-tight mb-5"
              style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              {project.title}
            </h1>
            {project.scopeDescription && (
              <p className="text-base text-[#4A5860] leading-relaxed max-w-2xl">{project.scopeDescription}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-7">
              {[
                { n: project.eligibleCount ?? data.startups.length, label: "Startups" },
                { n: requirements.length, label: "Criterios" },
                { n: data.clusters.length, label: data.clusters.length === 1 ? "Clúster" : "Clústeres" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2.5 bg-white border border-[#E2D9CF] rounded-xl px-4 py-2.5 shadow-sm">
                  <span className="text-2xl font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{s.n}</span>
                  <span className="text-xs text-[#6B7A84] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              {[
                { label: "Empresa",   value: project.clientName },
                { label: "Industria", value: project.industry },
                { label: "Analista",  value: project.analystName ?? "Equipo VCL studio" },
                { label: "Fecha",     value: fmtDate(project.reportDate) },
              ].filter(m => m.value).map(m => (
                <div key={m.label}>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#9BA8B0] uppercase mb-0.5">{m.label}</p>
                  <p className="text-sm font-semibold text-[#1B2A33]">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="border-t border-[#E2D9CF] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-6">Criterios de Evaluación</p>
          <div className="grid md:grid-cols-2 gap-5">
            {indispensable.length > 0 && (
              <div className="rounded-2xl border border-[#E2D9CF] overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#E2D9CF]" style={{ background: "#FFF5F0" }}>
                  <span className="w-2 h-2 rounded-full bg-[#E8521A]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#E8521A] uppercase">Indispensable</span>
                </div>
                <div className="p-5 space-y-3">
                  {indispensable.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#E8521A]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B2A33]">{r.name}</p>
                        {r.description && <p className="text-xs text-[#6B7A84] mt-0.5 leading-relaxed">{r.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {deseable.length > 0 && (
              <div className="rounded-2xl border border-[#E2D9CF] overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#E2D9CF]" style={{ background: "#EFF6FF" }}>
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  <span className="text-xs font-bold tracking-[0.2em] text-[#2563EB] uppercase">Deseable</span>
                </div>
                <div className="p-5 space-y-3">
                  {deseable.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1B2A33]">{r.name}</p>
                        {r.description && <p className="text-xs text-[#6B7A84] mt-0.5 leading-relaxed">{r.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Methodology — weight rings */}
      <div className="border-t border-[#E2D9CF]" style={{ backgroundColor: "#FDF6EE" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-2">Metodología: Weighted Scoring Matrix</p>
          <p className="text-sm text-[#6B7A84] mb-7 max-w-xl">Cada criterio recibe una ponderación; la suma genera un puntaje único por startup. Estos son los pesos relativos de cada criterio.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((r: any) => {
              const pct = Math.round((r.weight ?? 0) * 100);
              return (
                <div key={r.id} className="bg-white border border-[#E2D9CF] rounded-xl p-4 shadow-sm flex items-center gap-3.5">
                  {/* Conic ring */}
                  <div className="relative shrink-0 w-12 h-12 rounded-full"
                    style={{ background: `conic-gradient(#E8521A ${pct * 3.6}deg, #F0EBE3 0deg)` }}>
                    <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center">
                      <span className="text-[11px] font-black text-[#1B2A33] tabular-nums" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1B2A33] leading-tight">{r.name}</p>
                    <span className={`inline-block mt-1 text-[9px] font-black tracking-wider rounded-full px-1.5 py-0.5 uppercase ${r.mandatory ? "bg-[#FFF5F0] text-[#E8521A] border border-[#E8521A]/20" : "bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]"}`}>
                      {r.mandatory ? "Indispensable" : "Deseable"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Geography — moved down */}
      {(project.geoAllowed || project.geoExcluded) && (
        <div className="border-t border-[#E2D9CF] bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
            <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-5">Alcance Geográfico</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {project.geoAllowed && (
                <div className="rounded-2xl border border-[#E2D9CF] p-5" style={{ background: "#F0FDF4" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#059669] uppercase">Incluido</p>
                  </div>
                  <p className="text-sm text-[#1B2A33] font-medium">{project.geoAllowed}</p>
                </div>
              )}
              {project.geoExcluded && (
                <div className="rounded-2xl border border-[#E2D9CF] p-5 bg-[#FDFAF6]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#9BA8B0]" />
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#9BA8B0] uppercase">Excluido</p>
                  </div>
                  <p className="text-sm text-[#1B2A33] font-medium">{project.geoExcluded}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-[#E2D9CF] bg-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex justify-center">
          <button onClick={onNext}
            className="inline-flex items-center gap-3 bg-[#1B2A33] hover:bg-[#2C3E4A] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm tracking-wide">
            Ver Rankings
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Capital parser ────────────────────────────────────────────────────────
function parseFundingUSD(str: string | null | undefined): number | null {
  if (!str) return null;
  const s = str.replace(/[$€£,\s]/g, "").toUpperCase();
  const m = s.match(/([\d.]+)([KMB]?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const mult: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
  return n * (mult[m[2]] ?? 1);
}

function formatCapital(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6) return `$${Math.round(usd / 1e6)}M`;
  if (usd >= 1e3) return `$${Math.round(usd / 1e3)}K`;
  return `$${usd}`;
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE 2 — RANKINGS
// ══════════════════════════════════════════════════════════════════════════
function PageRankings({ data, onNext }: { data: any; onNext: () => void }) {
  const { rankings, startups, clusters, recommendations, project } = data;
  const [showProfiles, setShowProfiles] = useState(false);
  const startupMap = Object.fromEntries(startups.map((s: any) => [s.id, s]));
  // Assign distinct palette colors to clusters that have no color in DB
  const CLUSTER_PALETTE = ["#E8521A","#2563EB","#059669","#7C3AED","#D97706","#0891B2","#BE185D","#65A30D"];
  const clusterMap = Object.fromEntries(
    clusters.map((c: any, i: number) => [c.id, { ...c, color: c.color || CLUSTER_PALETTE[i % CLUSTER_PALETTE.length] }])
  );
  const recMap     = Object.fromEntries((recommendations ?? []).map((r: any) => [r.startupId, r]));

  const enriched = [...rankings]
    .sort((a: any, b: any) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((r: any) => ({ ...r, startup: startupMap[r.startupId], rec: recMap[r.startupId] }));

  const hasRecs = enriched.some((r: any) => r.rec?.narrative);

  // Capital raised across ranked startups
  const fundingAmounts = enriched.map((r: any) => parseFundingUSD(r.startup?.fundingAmount)).filter((v): v is number => v !== null);
  const totalCapital   = fundingAmounts.length > 0 ? fundingAmounts.reduce((a, b) => a + b, 0) : null;
  const knownCount     = fundingAmounts.length;
  // Distinct countries among ranked startups
  const countries = Array.from(new Set(
    enriched.map((r: any) => (r.startup?.hqCountry ?? "").trim()).filter((c: string) => c.length > 0)
  ));
  const countryCount = countries.length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={data.project} />

      <div className="bg-white border-b border-[#E2D9CF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-1">Rankings</p>
          <h2 className="text-3xl font-black text-[#1B2A33]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Lista Inicial de Startups Recomendadas
          </h2>
          <p className="text-sm text-[#6B7A84] mt-1.5">Pasa el cursor sobre un nombre para ver el perfil completo de cada startup</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10">

        {/* WSM definition */}
        <div className="bg-white border border-[#E2D9CF] rounded-2xl p-5 flex items-start gap-4 shadow-sm">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-[#FFF5F0] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#E8521A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17V7m4 10V11m4 6V9M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B2A33] mb-0.5">¿Qué es el Weighted Score?</p>
            <p className="text-xs text-[#6B7A84] leading-relaxed max-w-3xl">
              Es el resultado de la <strong>Weighted Scoring Matrix (WSM)</strong>: cada startup se evalúa de 0 a 4 en cada criterio,
              cada criterio tiene un peso según su importancia, y la suma ponderada produce un único puntaje sobre 10 que permite comparar startups de forma objetiva.
            </p>
          </div>
        </div>

        {/* Clusters */}
        {clusters.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-4">Clústeres de Soluciones</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clusters.map((c: any) => {
                const members = startups.filter((s: any) => s.clusterId === c.id);
                return (
                  <div key={c.id} className="bg-white border border-[#E2D9CF] rounded-2xl p-5 shadow-sm"
                    style={{ borderLeft: `4px solid ${c.color || "#E8521A"}` }}>
                    <p className="font-bold text-[#1B2A33] text-sm mb-1">{c.name}</p>
                    {c.description && <p className="text-xs text-[#6B7A84] mb-3 leading-relaxed">{c.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((s: any) => (
                        <span key={s.id} className="text-xs bg-[#F5F0EA] text-[#4A5860] rounded-lg px-2.5 py-1 font-medium">{s.name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis metrics: capital + countries */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {totalCapital !== null && (
            <div className="bg-white border border-[#E2D9CF] rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#FFF5F0] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#E8521A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#9BA8B0] uppercase">Capital Levantado</p>
                <p className="text-2xl font-black text-[#1B2A33] leading-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{formatCapital(totalCapital)}</p>
                <p className="text-[10px] text-[#9BA8B0] mt-0.5">entre {project.eligibleCount ?? enriched.length} startups evaluadas</p>
              </div>
            </div>
          )}
          {countryCount > 0 && (
            <div className="bg-white border border-[#E2D9CF] rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3.5"
              title={countries.join(" · ")}>
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[#9BA8B0] uppercase">Países</p>
                <p className="text-2xl font-black text-[#1B2A33] leading-tight" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{countryCount}</p>
                <p className="text-[10px] text-[#9BA8B0] mt-0.5">de origen de las startups</p>
              </div>
            </div>
          )}
        </div>

        {/* Tier explanation cards */}
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-4">Clasificación por Tier</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(TIERS).map(([k, t]) => (
              <div key={k} className="bg-white border rounded-2xl px-4 py-3.5 shadow-sm" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-xs font-black tracking-wide" style={{ color: t.text }}>{t.label}</span>
                </div>
                <p className="text-[11px] text-[#6B7A84] leading-snug">{t.rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings table */}
        <div className="bg-white rounded-2xl border border-[#E2D9CF] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B2A33]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest w-[200px]">Startup</th>
                {!showProfiles && <>
                  <th className="text-left px-3 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden md:table-cell w-[150px]">Cluster</th>
                  <th className="text-left px-3 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest w-[88px]">Score</th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest w-[110px]">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden lg:table-cell">Diferenciador</th>
                </>}
                {showProfiles && <>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest">Año Fund.</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden sm:table-cell">Ubicación</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden md:table-cell">Empleados</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden md:table-cell">Clientes Ref.</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden lg:table-cell">Etapa</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest">Fondos (USD)</th>
                </>}
                <th className="px-3 py-3.5 text-right">
                  <button onClick={() => setShowProfiles(v => !v)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#E8521A] text-white hover:bg-[#CC4415] shadow-sm transition-colors whitespace-nowrap">
                    {showProfiles ? (
                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>Rankings</>
                    ) : (
                      <>Perfiles<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((row: any, idx: number) => {
                const tier = TIERS[computeTier(row.rank ?? 99, row.wsmScore ?? 0, enriched.length)];
                const startup = row.startup;
                const cluster = startup?.clusterId ? clusterMap[startup.clusterId] : null;
                const logo = startup ? STARTUP_LOGOS[startup.name] : null;
                const location = [startup?.hqCity, startup?.hqCountry].filter(Boolean).join(", ");
                return (
                  <tr key={row.id} className={`border-b border-[#F0EBE3] transition-colors bg-white ${showProfiles ? "" : "hover:bg-[#FDFAF6]"}`}>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-[#9BA8B0]">{row.rank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {logo && (
                          <img src={logo} alt={startup.name}
                            className="w-12 h-12 rounded-lg object-contain shrink-0 border border-[#E2D9CF] bg-white p-1"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div className="min-w-0">
                          {startup ? <StartupName startup={startup} /> : <span className="font-semibold text-[#1B2A33]">-</span>}
                          {startup?.description && (
                            <p className="text-xs text-[#9BA8B0] mt-0.5 max-w-[160px] truncate">{startup.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {!showProfiles && <>
                      <td className="px-3 py-3 hidden md:table-cell">
                        {cluster
                          ? <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4A5860] bg-[#F5F0EA] rounded-lg px-2 py-1 leading-snug">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cluster.color || "#E8521A" }} />
                              {cluster.name}
                            </span>
                          : <span className="text-xs text-[#9BA8B0]">-</span>
                        }
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-black text-[#1B2A33] tabular-nums" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                            {row.wsmScore?.toFixed(1) ?? "-"}
                          </span>
                          <span className="text-[11px] text-[#9BA8B0]">/ 10</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                          style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
                          {tier.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs text-[#6B7A84] leading-relaxed">{startup?.keyDifferentiator ?? "-"}</p>
                      </td>
                    </>}
                    {showProfiles && <>
                      <td className="px-4 py-4 text-xs text-[#1B2A33] font-medium">{startup?.foundedYear ?? "-"}</td>
                      <td className="px-4 py-4 text-xs text-[#4A5860] hidden sm:table-cell">{location || "-"}</td>
                      <td className="px-4 py-4 text-xs text-[#4A5860] hidden md:table-cell">{startup?.employeeRange ?? "-"}</td>
                      <td className="px-4 py-4 text-xs text-[#4A5860] hidden md:table-cell max-w-[160px]">
                        <span className="truncate block" title={startup?.clientsRef ?? undefined}>{startup?.clientsRef ?? "-"}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        {startup?.fundingStage
                          ? <span className="inline-block text-xs bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] rounded-full px-2.5 py-1 font-semibold whitespace-nowrap">{startup.fundingStage}</span>
                          : <span className="text-xs text-[#9BA8B0]">-</span>
                        }
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-[#1B2A33]">{startup?.fundingAmount ?? "-"}</td>
                    </>}
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Analyst recommendations — always show section if there are startups */}
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-4">Recomendaciones del Analista</p>
          {hasRecs ? (
            <div className="grid md:grid-cols-2 gap-4">
              {enriched.filter((r: any) => r.rec?.narrative).map((row: any) => {
                const tier = TIERS[computeTier(row.rank ?? 99, row.wsmScore ?? 0, enriched.length)];
                const logo = row.startup ? STARTUP_LOGOS[row.startup.name] : null;
                return (
                  <div key={row.startupId} className="bg-white border border-[#E2D9CF] rounded-2xl p-5 shadow-sm overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: tier.color }} />
                    <div className="pl-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          {logo && (
                            <img src={logo} alt={row.startup.name}
                              className="w-6 h-6 rounded-md object-contain border border-[#E2D9CF] bg-white p-0.5"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          )}
                          <span className="font-bold text-sm text-[#1B2A33]">#{row.rank} {row.startup?.name}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full border shrink-0"
                          style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}>
                          {tier.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A5860] leading-relaxed">{row.rec.narrative}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#E2D9CF] rounded-2xl p-8 text-center">
              <div className="w-10 h-10 bg-[#F5F0EA] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-[#9BA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1B2A33] mb-1">Recomendaciones en preparación</p>
              <p className="text-xs text-[#9BA8B0]">El analista está completando las recomendaciones individuales para este reporte.</p>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-2 pb-2">
          <button onClick={onNext}
            className="inline-flex items-center gap-3 bg-[#1B2A33] hover:bg-[#2C3E4A] text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm tracking-wide">
            Ver Matriz de Evaluación
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE 3 — MATRIZ  (headers rotados = sin scroll horizontal)
// ══════════════════════════════════════════════════════════════════════════
function PageMatrix({ data, onNavigate }: { data: any; onNavigate?: () => void }) {
  const { requirements, startups, wsmScores, rankings } = data;
  const rankMap = Object.fromEntries(rankings.map((r: any) => [r.startupId, r]));
  const sortedStartups = [...startups]
    .filter((s: any) => s.eligible !== false)
    .sort((a: any, b: any) => (rankMap[a.id]?.rank ?? 99) - (rankMap[b.id]?.rank ?? 99));
  const sortedReqs = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));
  const scoreMap: Record<number, Record<number, any>> = {};
  for (const s of wsmScores) {
    if (!scoreMap[s.startupId]) scoreMap[s.startupId] = {};
    scoreMap[s.startupId][s.requirementId] = s;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={data.project} />

      <div className="bg-white border-b border-[#E2D9CF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-1">Evaluación Detallada</p>
          <h2 className="text-3xl font-black text-[#1B2A33]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Matriz de Evaluación
          </h2>
          <p className="text-sm text-[#6B7A84] mt-1.5">Escala 0–4 · Pasa el cursor sobre un criterio o puntaje para ver más detalle</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-10 py-8">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[4,3,2,1,0].map(n => {
            const s = SCORE_STYLES[n];
            const labels = ["Ausente","Débil","Regular","Bueno","Excelente"];
            return (
              <span key={n} className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border"
                style={{ background: s.bg, color: s.text, borderColor: s.bar }}>
                <span className="w-2 h-2 rounded-sm" style={{ background: s.bar }} />
                {n}: {labels[n]}
              </span>
            );
          })}
        </div>

        {/* Matrix — horizontal headers, tooltip on hover */}
        <div className="bg-white rounded-2xl border border-[#E2D9CF] shadow-sm overflow-x-auto">
          <table className="border-collapse" style={{ minWidth: "100%", tableLayout: "fixed", width: `${180 + sortedReqs.length * 82 + 64}px` }}>
            <colgroup>
              <col style={{ width: "172px" }} />
              {sortedReqs.map((r: any) => <col key={r.id} style={{ width: "82px" }} />)}
              <col style={{ width: "64px" }} />
            </colgroup>
            <thead>
              <tr className="bg-[#1B2A33]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest sticky left-0 bg-[#1B2A33] z-10">
                  Startup
                </th>
                {sortedReqs.map((r: any) => (
                  <th key={r.id} className="px-1 py-3 text-center">
                    <CriterionHeader req={r} />
                  </th>
                ))}
                <th className="text-center text-xs font-bold text-white bg-[#E8521A] tracking-widest px-2 py-3">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStartups.map((startup: any, idx: number) => {
                const ranking = rankMap[startup.id];
                const logo = STARTUP_LOGOS[startup.name];
                return (
                  <tr key={startup.id} className="border-b border-[#F0EBE3] hover:bg-[#FFF8F5] transition-colors bg-white">
                    {/* Startup cell */}
                    <td className="px-3 py-3 sticky left-0 z-10 border-r border-[#E2D9CF] bg-white">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center text-sm font-bold text-[#9BA8B0] shrink-0">
                          {ranking?.rank ?? "-"}
                        </span>
                        {logo && (
                          <img src={logo} alt={startup.name}
                            className="w-9 h-9 rounded-lg object-contain shrink-0 border border-[#E2D9CF] bg-white p-1"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div className="min-w-0">
                          <StartupName startup={startup} />
                          {startup.hqCountry && <p className="text-[11px] text-[#9BA8B0] truncate">{startup.hqCountry}</p>}
                        </div>
                      </div>
                    </td>
                    {/* Score cells */}
                    {sortedReqs.map((r: any) => {
                      const entry = scoreMap[startup.id]?.[r.id];
                      const raw   = entry?.humanScore ?? entry?.aiScore;
                      const score = raw != null ? Math.min(4, Math.max(0, Math.round(raw / 2.5))) : null;
                      const style = score != null ? SCORE_STYLES[score] : null;
                      return (
                        <td key={r.id} className="p-1">
                          <ScoreTooltip rationale={entry?.rationale}>
                            <div className="flex items-center justify-center rounded-lg text-sm font-bold transition-transform hover:scale-110 relative overflow-hidden"
                              style={{
                                height: "36px",
                                background: style ? style.bg : "#F5F4F1",
                                color: style ? style.text : "#9CA3AF",
                              }}>
                              {score != null ? score : "-"}
                              {style && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: style.bar }} />}
                            </div>
                          </ScoreTooltip>
                        </td>
                      );
                    })}
                    {/* WSM total */}
                    <td className="px-2 py-3 text-center bg-[#FFF5F0]">
                      <span className="text-sm font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                        {ranking?.wsmScore?.toFixed(1) ?? "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[#9BA8B0] mt-5 text-center">
          Evaluación independiente por el equipo de análisis de VCL studio · Basada en documentación pública
        </p>

        {/* CTA → Simulador */}
        {onNavigate && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onNavigate}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              style={{ background: "#E8521A" }}
            >
              Explorar en el Simulador
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE 0 — BRIEFING DEL PROBLEMA
// ══════════════════════════════════════════════════════════════════════════
function BriefingSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2D9CF] rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border-[#ccc]">
      <div className="flex items-center gap-2.5 px-6 py-3 border-b border-[#E2D9CF] bg-[#FDFAF6] print:bg-gray-50">
        <span className="w-1 h-4 rounded-full bg-[#E8521A] shrink-0" />
        <p className="text-xs font-black tracking-[0.2em] text-[#1B2A33] uppercase">{label}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function PageBriefing({ data, onContinue, sessionToken }: { data: any; onContinue: () => void; sessionToken: string }) {
  const { project, requirements } = data;
  const briefing = useMemo(() => {
    try { return project.briefingContent ? JSON.parse(project.briefingContent) : null; }
    catch { return null; }
  }, [project.briefingContent]);

  const [authorName, setAuthorName] = useState("");
  const [generalComment, setGeneralComment] = useState("");
  const [criterionComments, setCriterionComments] = useState<Record<number, { comment: string; weight: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = trpc.report.submitFeedback.useMutation({
    onSuccess: () => { setSubmitted(true); setSubmitting(false); },
    onError: () => setSubmitting(false),
  });

  const handleSubmitFeedback = () => {
    const items: any[] = [];
    if (generalComment.trim()) {
      items.push({ section: "general", commentText: generalComment.trim() });
    }
    for (const [reqId, val] of Object.entries(criterionComments)) {
      const w = parseFloat(val.weight);
      if (val.comment.trim() || (!isNaN(w) && w >= 0 && w <= 100)) {
        items.push({
          section: "criterion",
          requirementId: parseInt(reqId),
          commentText: val.comment.trim() || "(sin comentario)",
          suggestedWeight: (!isNaN(w) && w >= 0 && w <= 100) ? w / 100 : undefined,
        });
      }
    }
    if (!items.length) return;
    setSubmitting(true);
    submitFeedback.mutate({ sessionToken, projectId: project.id, authorName: authorName.trim() || undefined, items });
  };

  const hasFeedback = generalComment.trim().length > 0 ||
    Object.values(criterionComments).some(v => v.comment.trim() || v.weight.trim());

  // ── No briefing available ──
  if (!briefing) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
        <PortalHeader project={project} />
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-20 text-center">
          <div className="w-14 h-14 bg-[#F5F0EA] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#9BA8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-[#1B2A33] mb-2">Reporte en preparación</p>
          <p className="text-sm text-[#6B7A84] mb-8">El equipo de VCL studio está finalizando el reporte de caracterización del problema.</p>
          <button onClick={onContinue}
            className="inline-flex items-center gap-3 bg-[#1B2A33] text-white font-bold px-8 py-4 rounded-xl text-sm hover:bg-[#2C3E4A] transition-all shadow-lg hover:-translate-y-0.5">
            Continuar al análisis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      </div>
    );
  }

  const { participant, workshop, problemsIdentified, selectedProblem, characterization, reportedFacts, impact, feasibility, recommendation } = briefing;
  const sortedReqs = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={project} />

      {/* Hero */}
      <div className="bg-white border-b border-[#E2D9CF] print:border-gray-200">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 print:py-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-2 print:text-gray-500">Caracterización del Problema</p>
              <h1 className="text-3xl lg:text-4xl font-black text-[#1B2A33] leading-tight mb-3" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                {selectedProblem?.statement ?? project.title}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7A84]">
                {participant?.name && <span><span className="font-semibold text-[#1B2A33]">{participant.name}</span> · {participant.role}</span>}
                {participant?.date && <span>{fmtDate(participant.date)}</span>}
                {workshop && <span className="text-[#9BA8B0]">{workshop}</span>}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="print:hidden shrink-0 inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E2D9CF] text-[#6B7A84] hover:bg-[#F5F0EA] hover:text-[#1B2A33] transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8 space-y-5 print:py-4 print:space-y-4">

        {/* 1. Caracterización del problema */}
        {(characterization || reportedFacts?.length || selectedProblem?.type || problemsIdentified?.length) && (
          <BriefingSection label="1 · Caracterización del Problema">
            <div className="space-y-4">
              {/* Problems identified — dropdown, focus on selected */}
              {problemsIdentified?.length > 0 && (() => {
                const selected = problemsIdentified.find((p: any) => p.selected);
                const others = problemsIdentified.filter((p: any) => !p.selected);
                return (
                  <details className="group rounded-xl border border-[#E8521A]/30 bg-[#FFF8F5] overflow-hidden">
                    <summary className="flex items-center gap-3 p-3.5 cursor-pointer list-none select-none">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#E8521A] text-white flex items-center justify-center">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1B2A33]">{selected?.name ?? "Problema priorizado"}</p>
                        <span className="text-[10px] font-bold text-[#E8521A] uppercase tracking-wider">Seleccionado para scouting</span>
                      </div>
                      {others.length > 0 && (
                        <span className="shrink-0 text-[10px] text-[#9BA8B0] flex items-center gap-1 group-open:hidden">
                          +{others.length} más
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      )}
                    </summary>
                    {others.length > 0 && (
                      <div className="px-3.5 pb-3.5 space-y-2 border-t border-[#E8521A]/15 pt-3">
                        <p className="text-[10px] font-bold text-[#9BA8B0] uppercase tracking-wider">Otros problemas considerados</p>
                        {others.map((p: any, i: number) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-[#C8BFB5]" />
                            <p className="text-xs text-[#6B7A84]">{p.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                );
              })()}

              {selectedProblem?.type && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]">
                  Tipo de problema: {selectedProblem.type}
                </span>
              )}
              {characterization && <p className="text-sm text-[#4A5860] leading-relaxed whitespace-pre-line">{characterization}</p>}
              {reportedFacts?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#9BA8B0] uppercase tracking-wider mb-2">Hechos reportados</p>
                  <ul className="space-y-1.5">
                    {reportedFacts.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#4A5860]">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#E8521A] mt-1.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </BriefingSection>
        )}

        {/* 2. Contexto */}
        {selectedProblem && (selectedProblem.context || selectedProblem.knownSolutions || selectedProblem.previousAttempts) && (
          <BriefingSection label="2 · Contexto">
            <div className="space-y-4">
              {selectedProblem.context && (
                <p className="text-sm text-[#4A5860] leading-relaxed">{selectedProblem.context}</p>
              )}
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                {selectedProblem.knownSolutions && (
                  <div className="bg-[#FDFAF6] border border-[#E2D9CF] rounded-xl p-3.5">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#9BA8B0] uppercase mb-1.5">Referencias de mercado</p>
                    <p className="text-xs text-[#4A5860] leading-relaxed">{selectedProblem.knownSolutions}</p>
                  </div>
                )}
                {selectedProblem.previousAttempts && (
                  <div className="bg-[#FDFAF6] border border-[#E2D9CF] rounded-xl p-3.5">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#9BA8B0] uppercase mb-1.5">Intentos previos</p>
                    <p className="text-xs text-[#4A5860] leading-relaxed">{selectedProblem.previousAttempts}</p>
                  </div>
                )}
              </div>
            </div>
          </BriefingSection>
        )}

        {/* 3. Criterios */}
        {sortedReqs.length > 0 && (
          <BriefingSection label="3 · Criterios y Requisitos de la Solución">
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7A84]">
                <span className="text-[9px] font-black tracking-wider bg-[#FFF5F0] border border-[#E8521A]/30 text-[#E8521A] rounded-full px-2 py-0.5 uppercase">IND</span>
                Indispensable
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6B7A84]">
                <span className="text-[9px] font-black tracking-wider bg-[#EFF6FF] border border-[#93C5FD] text-[#2563EB] rounded-full px-2 py-0.5 uppercase">DES</span>
                Deseable
              </span>
            </div>
            <div className="space-y-2.5">
              {sortedReqs.map((r: any) => (
                <div key={r.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-[#F0EBE3] bg-[#FDFAF6]">
                  <div className="shrink-0 mt-0.5">
                    {r.mandatory
                      ? <span className="inline-block text-[9px] font-black tracking-wider bg-[#FFF5F0] border border-[#E8521A]/30 text-[#E8521A] rounded-full px-2 py-0.5 uppercase">IND</span>
                      : <span className="inline-block text-[9px] font-black tracking-wider bg-[#EFF6FF] border border-[#93C5FD] text-[#2563EB] rounded-full px-2 py-0.5 uppercase">DES</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[#1B2A33]">{r.name}</p>
                      <span className="shrink-0 text-sm font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{(r.weight * 100).toFixed(0)}%</span>
                    </div>
                    {r.description && <p className="text-xs text-[#6B7A84] leading-relaxed">{r.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </BriefingSection>
        )}

        {/* 4. Factibilidad */}
        {feasibility && (
          <BriefingSection label="4 · Factibilidad de Piloto y Adopción">
            <div className="space-y-4">
              {/* Urgency meter */}
              {feasibility.urgency != null && (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#9BA8B0] uppercase mb-1">Urgencia</p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-3xl font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{feasibility.urgency}</span>
                      <span className="text-sm text-[#9BA8B0] mb-1">/ {feasibility.urgencyMax ?? 10}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#E8521A]" style={{ width: `${(feasibility.urgency / (feasibility.urgencyMax ?? 10)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}
              {/* Feasibility data (no stakeholders) */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  { label: "Horizonte", val: feasibility.timeline },
                  { label: "Presupuesto piloto", val: feasibility.pilotBudget },
                  { label: "Presupuesto adopción", val: feasibility.adoptionBudget },
                  { label: "Adopción objetivo", val: feasibility.adoptionTarget },
                ].filter(x => x.val).map(x => (
                  <div key={x.label} className="bg-[#FDFAF6] border border-[#E2D9CF] rounded-xl p-3">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#9BA8B0] uppercase mb-0.5">{x.label}</p>
                    <p className="text-xs font-semibold text-[#1B2A33]">{x.val}</p>
                  </div>
                ))}
              </div>
              {feasibility.pilotScope && (
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-4">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#2563EB] uppercase mb-1.5">Alcance recomendado del piloto</p>
                  <p className="text-xs text-[#1E3A8A] leading-relaxed">{feasibility.pilotScope}</p>
                </div>
              )}
            </div>
          </BriefingSection>
        )}

        {/* 5. Stakeholders y su contexto */}
        {feasibility && (feasibility.problemOwner || feasibility.processOwner || feasibility.itData || feasibility.legal || feasibility.executiveSponsor) && (
          <BriefingSection label="5 · Stakeholders y su Contexto">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { label: "Dueño del problema", val: feasibility.problemOwner, hint: "Responsable final del problema" },
                { label: "Dueño del proceso", val: feasibility.processOwner, hint: "Lidera la iniciativa día a día" },
                { label: "IT / Data", val: feasibility.itData, hint: "Integración técnica y datos" },
                { label: "Compras / Legal", val: feasibility.legal, hint: "Contratación y cumplimiento" },
                { label: "Sponsor ejecutivo", val: feasibility.executiveSponsor, hint: "Respaldo y presupuesto" },
              ].filter(x => x.val).map(x => (
                <div key={x.label} className="bg-[#FDFAF6] border border-[#E2D9CF] rounded-xl p-3.5 flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-[#E2D9CF] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#E8521A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.15em] text-[#9BA8B0] uppercase mb-0.5">{x.label}</p>
                    <p className="text-sm font-semibold text-[#1B2A33] leading-tight">{x.val}</p>
                    <p className="text-[10px] text-[#9BA8B0] mt-0.5">{x.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </BriefingSection>
        )}

        {/* 6. Fórmulas e impacto */}
        {impact?.dimensions?.length > 0 && (
          <BriefingSection label="6 · Fórmulas e Impacto Estimado">
            <div className="space-y-3">
              {impact.dimensions.map((dim: any, i: number) => (
                <div key={i} className={`rounded-xl border p-4 ${i === 0 ? "border-[#E8521A]/25 bg-[#FFF8F5]" : "border-[#E2D9CF] bg-[#FDFAF6]"}`}>
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <p className="font-bold text-sm text-[#1B2A33]">{dim.label}</p>
                    {dim.estimate && (
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${i === 0 ? "bg-[#E8521A] text-white" : "bg-[#F0EBE3] text-[#6B7A84]"}`}
                        style={{ fontFamily: "'Archivo Black', sans-serif" }}>{dim.estimate}</span>
                    )}
                  </div>
                  {dim.evidence && <p className="text-xs text-[#6B7A84] leading-relaxed mb-2">{dim.evidence}</p>}
                  {dim.formula && (
                    <div className="bg-white border border-[#E2D9CF] rounded-lg px-3 py-2 font-mono text-xs text-[#4A5860]">
                      {dim.formula}
                    </div>
                  )}
                </div>
              ))}
              {impact.note && <p className="text-xs text-[#9BA8B0] leading-relaxed italic">{impact.note}</p>}
            </div>
          </BriefingSection>
        )}

        {/* 7. Recomendación */}
        {recommendation && (
          <BriefingSection label="7 · Recomendación de Avance">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#6EE7B7] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-[#1B2A33] leading-relaxed font-medium flex-1">{recommendation}</p>
            </div>
          </BriefingSection>
        )}

        {/* ── Feedback form ── */}
        <div className="print:hidden">
          <div className="border-t border-[#E2D9CF] pt-8 mt-4">
            <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-1">Tu opinión</p>
            <h3 className="text-xl font-black text-[#1B2A33] mb-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Comentarios sobre el reporte</h3>
            <p className="text-sm text-[#6B7A84] mb-6">Puedes agregar observaciones, sugerir ajustes a los criterios o proponer pesos. El equipo VCL los revisará antes de avanzar al scouting.</p>

            {submitted ? (
              <div className="bg-[#ECFDF5] border border-[#6EE7B7] rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-[#6EE7B7]">
                  <svg className="w-6 h-6 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-bold text-[#065F46] mb-1">Comentarios enviados</p>
                <p className="text-sm text-[#059669]">El equipo de VCL studio los recibirá antes de avanzar al scouting. ¡Gracias!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Author */}
                <div>
                  <label className="block text-xs font-bold text-[#6B7A84] uppercase tracking-wider mb-2">Tu nombre (opcional)</label>
                  <input
                    type="text"
                    placeholder="Nombre o cargo"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full max-w-sm bg-white border border-[#E2D9CF] rounded-xl px-4 py-2.5 text-sm text-[#1B2A33] placeholder-[#C8BFB5] outline-none focus:border-[#E8521A] focus:ring-2 focus:ring-[#E8521A]/10"
                  />
                </div>

                {/* General comment */}
                <div>
                  <label className="block text-xs font-bold text-[#6B7A84] uppercase tracking-wider mb-2">Comentario general</label>
                  <textarea
                    rows={3}
                    placeholder="Observaciones sobre el problema, contexto adicional, correcciones, etc."
                    value={generalComment}
                    onChange={e => setGeneralComment(e.target.value)}
                    className="w-full bg-white border border-[#E2D9CF] rounded-xl px-4 py-3 text-sm text-[#1B2A33] placeholder-[#C8BFB5] outline-none focus:border-[#E8521A] focus:ring-2 focus:ring-[#E8521A]/10 resize-none"
                  />
                </div>

                {/* Per-criterion feedback */}
                <div>
                  <label className="block text-xs font-bold text-[#6B7A84] uppercase tracking-wider mb-3">Ajustes por criterio (opcional)</label>
                  <p className="text-xs text-[#9BA8B0] mb-4">Si deseas sugerir un peso diferente para algún criterio o agregar una observación específica, puedes hacerlo aquí.</p>
                  <div className="space-y-3">
                    {sortedReqs.map((r: any) => (
                      <div key={r.id} className="bg-white border border-[#E2D9CF] rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            {r.mandatory
                              ? <span className="text-[9px] font-black tracking-wider bg-[#FFF5F0] border border-[#E8521A]/30 text-[#E8521A] rounded-full px-2 py-0.5 uppercase">IND</span>
                              : <span className="text-[9px] font-black tracking-wider bg-[#EFF6FF] border border-[#93C5FD] text-[#2563EB] rounded-full px-2 py-0.5 uppercase">DES</span>
                            }
                            <p className="text-sm font-semibold text-[#1B2A33]">{r.name}</p>
                          </div>
                          <span className="text-xs text-[#9BA8B0]">Peso actual: <strong className="text-[#E8521A]">{(r.weight * 100).toFixed(0)}%</strong></span>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <div className="w-28">
                            <label className="block text-[10px] text-[#9BA8B0] font-bold uppercase tracking-wider mb-1.5">Peso sugerido (%)</label>
                            <input
                              type="number" min="0" max="100" placeholder="—"
                              value={criterionComments[r.id]?.weight ?? ""}
                              onChange={e => setCriterionComments(prev => ({
                                ...prev,
                                [r.id]: { ...prev[r.id], weight: e.target.value, comment: prev[r.id]?.comment ?? "" }
                              }))}
                              className="w-full bg-[#FDFAF6] border border-[#E2D9CF] rounded-lg px-3 py-2 text-sm text-[#1B2A33] outline-none focus:border-[#E8521A] focus:ring-1 focus:ring-[#E8521A]/20"
                            />
                          </div>
                          <div className="flex-1 min-w-[160px]">
                            <label className="block text-[10px] text-[#9BA8B0] font-bold uppercase tracking-wider mb-1.5">Observación</label>
                            <input
                              type="text" placeholder="Ajuste, duda o comentario sobre este criterio"
                              value={criterionComments[r.id]?.comment ?? ""}
                              onChange={e => setCriterionComments(prev => ({
                                ...prev,
                                [r.id]: { ...prev[r.id], comment: e.target.value, weight: prev[r.id]?.weight ?? "" }
                              }))}
                              className="w-full bg-[#FDFAF6] border border-[#E2D9CF] rounded-lg px-3 py-2 text-sm text-[#1B2A33] placeholder-[#C8BFB5] outline-none focus:border-[#E8521A] focus:ring-1 focus:ring-[#E8521A]/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmitFeedback}
                  disabled={!hasFeedback || submitting}
                  className="inline-flex items-center gap-2 bg-[#1B2A33] hover:bg-[#2C3E4A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-md hover:-translate-y-0.5">
                  {submitting ? "Enviando…" : "Enviar comentarios"}
                  {!submitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Continue CTA */}
        <div className="py-4 flex justify-center print:hidden">
          <button onClick={onContinue}
            className="inline-flex items-center gap-3 bg-[#E8521A] hover:bg-[#CC4415] text-white font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm tracking-wide">
            Continuar al análisis
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE 4 — SIMULADOR DE ESCENARIOS
// ══════════════════════════════════════════════════════════════════════════
function PageSimulator({ data }: { data: any }) {
  const { requirements, startups, wsmScores, rankings } = data;

  // Weights as integer percentages (0–50 per criterion)
  const initWeights = () =>
    Object.fromEntries(requirements.map((r: any) => [r.id, Math.round(r.weight * 100)]));
  const [weights, setWeights] = useState<Record<number, number>>(initWeights);

  const scoreMap = useMemo(() => {
    const m: Record<number, Record<number, any>> = {};
    for (const s of wsmScores) {
      if (!m[s.startupId]) m[s.startupId] = {};
      m[s.startupId][s.requirementId] = s;
    }
    return m;
  }, [wsmScores]);

  const origRankMap = useMemo(
    () => Object.fromEntries(rankings.map((r: any) => [r.startupId, r.rank ?? 99])),
    [rankings]
  );

  const simulated = useMemo(() => {
    const totalW = Object.values(weights).reduce((a: number, b: number) => a + b, 0);
    const eligible = startups.filter((s: any) => s.eligible !== false);
    const scored = eligible.map((s: any) => {
      const wsm =
        totalW === 0
          ? 0
          : requirements.reduce((sum: number, r: any) => {
              const entry = scoreMap[s.id]?.[r.id];
              const raw = entry?.humanScore ?? entry?.aiScore ?? 0;
              return sum + (weights[r.id] ?? 0) * raw;
            }, 0) / totalW;
      return { startup: s, simScore: wsm, origRank: origRankMap[s.id] ?? 99 };
    });
    scored.sort((a: any, b: any) => b.simScore - a.simScore);
    return scored.map((item: any, idx: number) => ({ ...item, simRank: idx + 1 }));
  }, [weights, startups, requirements, scoreMap, origRankMap]);

  const totalW = Object.values(weights).reduce((a: number, b: number) => a + b, 0);
  const isModified = requirements.some(
    (r: any) => (weights[r.id] ?? 0) !== Math.round(r.weight * 100)
  );
  const sortedReqs = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={data.project} />

      {/* Header */}
      <div className="bg-white border-b border-[#E2D9CF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-1">Análisis de Escenarios</p>
            <h2 className="text-3xl font-black text-[#1B2A33]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              Simulador WSM
            </h2>
            <p className="text-sm text-[#6B7A84] mt-1.5">
              Ajusta los pesos de los criterios y observa cómo se reordena el ranking en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isModified && (
              <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Escenario modificado
              </span>
            )}
            <button
              onClick={() => setWeights(initWeights())}
              disabled={!isModified}
              className="text-xs font-bold px-4 py-2 rounded-xl border border-[#E2D9CF] text-[#6B7A84] hover:bg-[#F5F0EA] hover:text-[#1B2A33] disabled:opacity-30 transition-all">
              ↺ Restablecer
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Left: sliders ── */}
          <div className="lg:w-[360px] shrink-0">
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase">Ponderación de Criterios</p>
                <span className={`text-xs tabular-nums font-semibold ${Math.abs(totalW - 100) > 5 ? "text-amber-500" : "text-[#059669]"}`}>Σ {totalW}%</span>
              </div>

              <div className="space-y-2.5">
                {sortedReqs.map((r: any) => {
                  const w = weights[r.id] ?? 0;
                  const effectivePct = totalW > 0 ? (w / totalW * 100) : 0;
                  const changed = w !== Math.round(r.weight * 100);
                  return (
                    <div key={r.id}
                      className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${changed ? "border-[#E8521A]/40 bg-[#FFF8F5]" : "border-[#E2D9CF]"}`}>
                      <div className="flex items-center justify-between mb-2.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {r.mandatory
                            ? <span className="shrink-0 text-[9px] font-black tracking-wider text-[#E8521A] bg-[#FFF5F0] border border-[#E8521A]/20 rounded-full px-1.5 py-0.5 uppercase">IND</span>
                            : <span className="shrink-0 text-[9px] font-black tracking-wider text-[#2563EB] bg-[#EFF6FF] border border-[#93C5FD] rounded-full px-1.5 py-0.5 uppercase">DES</span>
                          }
                          <p className="text-xs font-semibold text-[#1B2A33] leading-tight">{r.name}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-sm font-black text-[#1B2A33] tabular-nums" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{w}<span className="text-xs font-semibold text-[#9BA8B0]">%</span></span>
                          {totalW > 0 && <p className="text-[9px] text-[#C8BFB5] tabular-nums">{effectivePct.toFixed(0)}% efectivo</p>}
                        </div>
                      </div>
                      <input
                        type="range" min="0" max="50" step="1"
                        value={w}
                        onChange={e => setWeights(prev => ({ ...prev, [r.id]: parseInt(e.target.value) }))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#E8521A]"
                        style={{
                          background: `linear-gradient(to right, ${changed ? "#E8521A" : "#9BA8B0"} ${w / 50 * 100}%, #F0EBE3 ${w / 50 * 100}%)`
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#C8BFB5] mt-5 leading-relaxed text-center">
                Ranking recalculado en tiempo real · Solo exploratorio, no modifica el reporte
              </p>
            </div>
          </div>

          {/* ── Right: animated ranking cards ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase">Ranking Simulado</p>
              <div className="flex items-center gap-4 text-[10px] text-[#9BA8B0]">
                <span className="flex items-center gap-1.5"><span className="text-emerald-600 font-bold text-xs">↑</span> Sube vs original</span>
                <span className="flex items-center gap-1.5"><span className="text-red-500 font-bold text-xs">↓</span> Baja</span>
              </div>
            </div>

            <motion.div layout className="space-y-2.5">
              {simulated.map((item: any, idx: number) => {
                const { startup, simScore, origRank, simRank } = item;
                const logo = STARTUP_LOGOS[startup.name];
                const delta = origRank - simRank; // positive = moved up in ranking
                const location = [startup.hqCity, startup.hqCountry].filter(Boolean).join(", ");
                const tier = TIERS[computeTier(simRank, simScore, simulated.length)];

                return (
                  <motion.div
                    key={startup.id}
                    layout
                    layoutId={`sim-${startup.id}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      layout: { type: "spring", stiffness: 280, damping: 28 },
                      opacity: { duration: 0.25, delay: idx * 0.025 },
                      y: { duration: 0.25, delay: idx * 0.025 },
                    }}
                    className="bg-white border border-[#E2D9CF] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank + delta */}
                      <div className="flex flex-col items-center gap-1 shrink-0 w-10 pt-0.5">
                        <span
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-black ${simRank === 1 ? "bg-[#E8521A] text-white shadow-md shadow-[#E8521A]/30" : "bg-[#F0EBE3] text-[#6B7A84]"}`}
                          style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                          {simRank}
                        </span>
                        {delta !== 0 ? (
                          <span className={`text-[10px] font-black leading-none ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#D1C9BE] leading-none">─</span>
                        )}
                      </div>

                      {/* Logo */}
                      {logo && (
                        <img src={logo} alt={startup.name}
                          className="w-10 h-10 rounded-xl object-contain shrink-0 border border-[#E2D9CF] bg-white p-1 mt-0.5"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Name row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {startup.websiteUrl
                                ? <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer"
                                    className="font-bold text-sm text-[#1B2A33] hover:text-[#E8521A] transition-colors underline decoration-dotted underline-offset-2">{startup.name}</a>
                                : <p className="font-bold text-sm text-[#1B2A33]">{startup.name}</p>
                              }
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tier.color }} />
                                {tier.label}
                              </span>
                            </div>
                            {startup.description && (
                              <p className="text-xs text-[#9BA8B0] mt-0.5 line-clamp-1">{startup.description}</p>
                            )}
                          </div>
                          {/* Score */}
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-black text-[#E8521A] tabular-nums leading-none"
                              style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                              {simScore.toFixed(1)}
                            </p>
                            <p className="text-[9px] text-[#9BA8B0]">/ 10</p>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div className="h-1 bg-[#F0EBE3] rounded-full overflow-hidden mb-3">
                          <motion.div
                            className="h-full rounded-full bg-[#E8521A]"
                            animate={{ width: `${(simScore / 10) * 100}%` }}
                            transition={{ type: "spring", stiffness: 200, damping: 25 }}
                          />
                        </div>

                        {/* Info pills */}
                        {(startup.foundedYear || location || startup.employeeRange || startup.fundingStage || startup.fundingAmount) && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {startup.foundedYear && (
                              <span className="text-[10px] text-[#6B7A84] bg-[#F5F0EA] rounded-md px-2 py-0.5 font-medium">Est. {startup.foundedYear}</span>
                            )}
                            {location && (
                              <span className="text-[10px] text-[#6B7A84] bg-[#F5F0EA] rounded-md px-2 py-0.5 font-medium">{location}</span>
                            )}
                            {startup.employeeRange && (
                              <span className="text-[10px] text-[#6B7A84] bg-[#F5F0EA] rounded-md px-2 py-0.5 font-medium">{startup.employeeRange} emp.</span>
                            )}
                            {startup.fundingStage && (
                              <span className="text-[10px] text-[#6B7A84] bg-[#F5F0EA] rounded-md px-2 py-0.5 font-medium">{startup.fundingStage}</span>
                            )}
                            {startup.fundingAmount && (
                              <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">{startup.fundingAmount}</span>
                            )}
                          </div>
                        )}

                        {/* Differentiator */}
                        {startup.keyDifferentiator && (
                          <p className="text-[11px] text-[#4A5860] leading-relaxed italic border-t border-[#F0EBE3] pt-2">
                            "{startup.keyDifferentiator}"
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOADING STATE
// ══════════════════════════════════════════════════════════════════════════
function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#FDF6EE" }}>
      <div className="text-center">
        <img src={ISOTIPO} alt="VCL" className="h-10 mx-auto mb-6 animate-pulse" />
        <div className="flex items-center gap-2 justify-center mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-sm text-[#6B7A84]">
            {LOADING_MSGS[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════
export default function ClientPortalV2() {
  const params = useParams<{ projectId?: string; clientSlug?: string; problemId?: string }>();

  const sessionKey = params.clientSlug && params.problemId
    ? `vcl_report_${params.clientSlug}_${params.problemId}`
    : params.projectId ? `vcl_report_legacy_${params.projectId}` : null;

  const sessionData = sessionKey ? (() => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) ?? ""); } catch { return null; }
  })() : null;

  const projectId    = sessionData?.projectId ?? parseInt(params.projectId ?? "0", 10);
  const sessionToken: string = sessionData?.sessionToken ?? "";
  const isSlugRoute  = !!(params.clientSlug && params.problemId);
  const hasSession   = isSlugRoute ? !!sessionData : true;

  const [submitted] = useState<string>(sessionData?.sessionToken ?? "");
  const [page, setPage] = useState<"briefing" | "context" | "rankings" | "matrix" | "simulator">("briefing");
  // Gate: unlock rest of platform after reading briefing
  const gateKey = sessionKey ? `vcl_briefing_ack_${sessionKey}` : null;
  const [briefingAcknowledged, setBriefingAcknowledged] = useState(
    () => !!gateKey && sessionStorage.getItem(gateKey) === "1"
  );
  const acknowledgeBriefing = () => {
    if (gateKey) sessionStorage.setItem(gateKey, "1");
    setBriefingAcknowledged(true);
    setPage("context");
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const slugQuery = trpc.report.getBySlug.useQuery(
    { clientSlug: params.clientSlug ?? "", problemId: params.problemId ?? "", sessionToken },
    { enabled: isSlugRoute && hasSession, retry: false }
  );
  const passkeyQuery = trpc.report.getByPasskey.useQuery(
    { projectId, sessionToken: submitted },
    { enabled: !isSlugRoute && submitted.length > 0 && projectId > 0, retry: false }
  );
  const { data, isLoading, error } = isSlugRoute ? slugQuery : passkeyQuery;

  // ── Session expired ──
  if (isSlugRoute && !hasSession) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FDF6EE" }}>
        <img src={LOGO_DARK} alt="VCL studio" className="h-14 object-contain mx-auto mb-8" />
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center border border-[#E2D9CF]">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p className="text-[#1B2A33] font-bold mb-1">Sesión expirada</p>
          <p className="text-sm text-[#6B7A84] mb-6">Vuelve a ingresar tu clave de acceso.</p>
          <a href="/acceso" className="inline-block w-full bg-[#E8521A] hover:bg-[#CC4415] text-white font-bold py-3 rounded-xl transition-colors text-sm">
            Acceder al reporte
          </a>
        </div>
      </div>
    );
  }

  if (!isSlugRoute && !submitted) { window.location.href = "/acceso"; return null; }
  if (isLoading) return <LoadingScreen />;
  if (!data || error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#FDF6EE" }}>
        <img src={LOGO_DARK} alt="VCL studio" className="h-8 mx-auto mb-4" />
        <p className="text-[#6B7A84] text-sm mb-4 text-center">No se pudo cargar el reporte. Verifica tu clave de acceso.</p>
        <a href="/acceso" className="text-[#E8521A] font-bold text-sm underline underline-offset-2">Volver al acceso</a>
      </div>
    );
  }

  // Readiness — a page is only available if its underlying content exists
  const hasRequirements = (data.requirements?.length ?? 0) > 0;
  const hasScoring = (data.startups?.length ?? 0) > 0 && (data.rankings?.length ?? 0) > 0;
  const pages = [
    { id: "briefing",  label: "Reporte",    gated: false, ready: true },
    { id: "context",   label: "Contexto",   gated: true,  ready: hasRequirements },
    { id: "rankings",  label: "Rankings",   gated: true,  ready: hasScoring },
    { id: "matrix",    label: "Evaluación", gated: true,  ready: hasScoring },
    { id: "simulator", label: "Simulador",  gated: true,  ready: hasScoring },
  ] as const;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      {/* Sticky nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E2D9CF] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-14">
          <div className="flex items-center gap-3 min-w-0">
            <img src={ISOTIPO} alt="VCL" className="h-6 w-6 object-contain shrink-0" />
            <span className="text-[10px] text-[#C8BFB5] hidden sm:block">|</span>
            <span className="text-xs font-medium text-[#6B7A84] hidden sm:block truncate max-w-[200px]">{data.project.title}</span>
          </div>
          <nav className="flex items-center gap-1">
            {pages.map(p => {
              const notReady = !p.ready;
              return (
                <button key={p.id}
                  onClick={() => !notReady && setPage(p.id)}
                  disabled={notReady}
                  className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                    page === p.id ? "bg-[#E8521A] text-white shadow-sm"
                    : notReady ? "text-[#D8D0C8] cursor-default"
                    : "text-[#6B7A84] hover:bg-[#F5F0EA] hover:text-[#1B2A33]"
                  }`}>
                  {p.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Animated page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={page} variants={pageVariants} initial="initial" animate="enter" exit="exit">
          {page === "briefing"   && <PageBriefing  data={data} onContinue={acknowledgeBriefing} sessionToken={sessionToken} />}
          {page === "context"    && <PageContext   data={data} onNext={() => setPage("rankings")} />}
          {page === "rankings"   && <PageRankings  data={data} onNext={() => setPage("matrix")} />}
          {page === "matrix"     && <PageMatrix    data={data} onNavigate={() => setPage("simulator")} />}
          {page === "simulator"  && <PageSimulator data={data} />}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2D9CF] py-7">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ISOTIPO} alt="VCL" className="h-5 w-5 opacity-30 object-contain" />
            <span className="text-xs text-[#9BA8B0]">© {new Date().getFullYear()} VCL studio · Confidencial</span>
          </div>
          <span className="text-xs text-[#9BA8B0]">{data.project.reportDate}</span>
        </div>
      </footer>
    </div>
  );
}
