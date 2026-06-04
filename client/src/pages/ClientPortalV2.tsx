import { useState, useRef, useEffect } from "react";
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
const TIERS: Record<number, { label: string; color: string; bg: string; text: string; border: string }> = {
  1: { label: "TOP PICK", color: "#059669", bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  2: { label: "STRONG",   color: "#2563EB", bg: "#DBEAFE", text: "#1E3A8A", border: "#93C5FD" },
  3: { label: "VIABLE",   color: "#D97706", bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  4: { label: "MONITOR",  color: "#DC2626", bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
};
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
    <span className="font-semibold text-[#1B2A33] hover:text-[#E8521A] transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
      onMouseEnter={trigger} onMouseLeave={hide}>
      {startup.name}
    </span>
  );

  return (
    <span className="relative">
      {startup.websiteUrl ? <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer">{nameEl}</a> : nameEl}
      {show && (
        <div className="fixed z-50 bg-white border border-[#E2D9CF] rounded-2xl shadow-2xl p-5 w-72"
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
            {startup.fundingStage && <><span className="text-[#9BA8B0]">Stage</span><span className="text-[#1B2A33]">{startup.fundingStage}</span></>}
            {startup.fundingAmount && <><span className="text-[#9BA8B0]">Funding</span><span className="text-[#1B2A33]">{startup.fundingAmount}</span></>}
            {startup.clientsRef && <><span className="text-[#9BA8B0]">Clientes</span><span className="text-[#1B2A33] truncate">{startup.clientsRef}</span></>}
          </div>
          {startup.keyDifferentiator && (
            <p className="mt-3 pt-3 border-t border-[#F0EBE3] text-xs text-[#6B7A84] italic leading-relaxed">{startup.keyDifferentiator}</p>
          )}
        </div>
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
              style={{ height: "40px", maxWidth: "160px" }}
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
                { n: data.startups.length, label: "Startups" },
                { n: requirements.length, label: "Criterios" },
                { n: indispensable.length, label: "Indispensables" },
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
                { label: "Fecha",     value: project.reportDate },
              ].filter(m => m.value).map(m => (
                <div key={m.label}>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-[#9BA8B0] uppercase mb-0.5">{m.label}</p>
                  <p className="text-sm font-semibold text-[#1B2A33]">{m.value}</p>
                </div>
              ))}
            </div>
            {(project.geoAllowed || project.geoExcluded) && (
              <div className="mt-5 pt-5 border-t border-[#F0EBE3] grid grid-cols-2 gap-4">
                {project.geoAllowed && (
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#059669] uppercase mb-0.5">Incluido</p>
                    <p className="text-xs text-[#1B2A33] font-medium">{project.geoAllowed}</p>
                  </div>
                )}
                {project.geoExcluded && (
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#9BA8B0] uppercase mb-0.5">Excluido</p>
                    <p className="text-xs text-[#1B2A33] font-medium">{project.geoExcluded}</p>
                  </div>
                )}
              </div>
            )}
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

      {/* Methodology weight bars */}
      <div className="border-t border-[#E2D9CF]" style={{ backgroundColor: "#FDF6EE" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-2">Metodología WSM</p>
          <p className="text-sm text-[#6B7A84] mb-7 max-w-xl">Weighted Scoring Matrix — {requirements.length} criterios ponderados, escala 0–4 por startup.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((r: any) => (
              <div key={r.id} className="bg-white border border-[#E2D9CF] rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#1B2A33] leading-tight pr-2">{r.name}</p>
                  <span className="shrink-0 text-lg font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                    {(r.weight * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#E8521A]" style={{ width: `${r.weight * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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

// ══════════════════════════════════════════════════════════════════════════
// PAGE 2 — RANKINGS
// ══════════════════════════════════════════════════════════════════════════
function PageRankings({ data, onNext }: { data: any; onNext: () => void }) {
  const { rankings, startups, clusters, recommendations } = data;
  const startupMap = Object.fromEntries(startups.map((s: any) => [s.id, s]));
  const clusterMap = Object.fromEntries(clusters.map((c: any) => [c.id, c]));
  const recMap     = Object.fromEntries((recommendations ?? []).map((r: any) => [r.startupId, r]));

  const enriched = [...rankings]
    .sort((a: any, b: any) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((r: any) => ({ ...r, startup: startupMap[r.startupId], rec: recMap[r.startupId] }));

  const hasRecs = enriched.some((r: any) => r.rec?.narrative);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={data.project} />

      <div className="bg-white border-b border-[#E2D9CF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-1">Rankings Finales</p>
          <h2 className="text-3xl font-black text-[#1B2A33]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Selección Estratégica
          </h2>
          <p className="text-sm text-[#6B7A84] mt-1.5">Weighted Scoring Matrix · Pasa el cursor sobre un nombre para ver el perfil completo</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 space-y-10">

        {/* Clusters */}
        {clusters.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-[#9BA8B0] uppercase mb-4">Clústeres Estratégicos</p>
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

        {/* Tier legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TIERS).map(([k, t]) => (
            <div key={k} className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold border"
              style={{ background: t.bg, color: t.text, borderColor: t.border }}>
              <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
              {t.label}
            </div>
          ))}
        </div>

        {/* Rankings table */}
        <div className="bg-white rounded-2xl border border-[#E2D9CF] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B2A33]">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest w-12">#</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest">Startup</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden md:table-cell">Cluster</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest">Score WSM</th>
                <th className="text-center px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest">Tier</th>
                <th className="text-left px-4 py-3.5 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest hidden lg:table-cell">Diferenciador</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((row: any, idx: number) => {
                const tier = TIERS[row.tier ?? 4] ?? TIERS[4];
                const startup = row.startup;
                const cluster = startup?.clusterId ? clusterMap[startup.clusterId] : null;
                const logo = startup ? STARTUP_LOGOS[startup.name] : null;
                return (
                  <tr key={row.id} className={`border-b border-[#F0EBE3] hover:bg-[#FDFAF6] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-[#FDFAF6]/50"}`}>
                    <td className="px-5 py-4 text-center">
                      {idx === 0
                        ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#E8521A] text-white text-xs font-black" style={{ fontFamily: "'Archivo Black', sans-serif" }}>1</span>
                        : <span className="text-sm font-bold text-[#9BA8B0]">{row.rank}</span>
                      }
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {logo && (
                          <img src={logo} alt={startup.name}
                            className="w-8 h-8 rounded-lg object-contain shrink-0 border border-[#E2D9CF] bg-white p-0.5"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div>
                          {startup ? <StartupName startup={startup} /> : <span className="font-semibold text-[#1B2A33]">—</span>}
                          {startup?.description && (
                            <p className="text-xs text-[#9BA8B0] mt-0.5 max-w-[200px] truncate">{startup.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      {cluster
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4A5860] bg-[#F5F0EA] rounded-lg px-2.5 py-1">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cluster.color || "#E8521A" }} />
                            {cluster.name}
                          </span>
                        : "—"
                      }
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl font-black text-[#1B2A33] tabular-nums" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                          {row.wsmScore?.toFixed(1) ?? "—"}
                        </span>
                        <div className="flex-1 max-w-[72px]">
                          <div className="h-1.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#E8521A]" style={{ width: `${((row.wsmScore ?? 0) / 10) * 100}%` }} />
                          </div>
                          <p className="text-[10px] text-[#9BA8B0] mt-0.5">/ 10</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
                        style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
                        {tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <p className="text-xs text-[#6B7A84] leading-relaxed max-w-[280px]">{startup?.keyDifferentiator ?? "—"}</p>
                    </td>
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
                const tier = TIERS[row.tier ?? 4] ?? TIERS[4];
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
function PageMatrix({ data }: { data: any }) {
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

  // Header height for rotated text — each req col gets a fixed height
  const HEADER_H = 130;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDF6EE" }}>
      <PortalHeader project={data.project} />

      <div className="bg-white border-b border-[#E2D9CF]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          <p className="text-xs font-bold tracking-[0.3em] text-[#E8521A] uppercase mb-1">Evaluación Detallada</p>
          <h2 className="text-3xl font-black text-[#1B2A33]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Matriz de Evaluación
          </h2>
          <p className="text-sm text-[#6B7A84] mt-1.5">Escala 0–4 · Pasa el cursor sobre un puntaje para ver el razonamiento del analista</p>
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
                {n} — {labels[n]}
              </span>
            );
          })}
        </div>

        {/* Matrix — rotated headers eliminate horizontal scroll */}
        <div className="bg-white rounded-2xl border border-[#E2D9CF] shadow-sm overflow-hidden">
          <table className="w-full border-collapse table-fixed">
            <colgroup>
              <col style={{ width: "180px" }} />
              {sortedReqs.map((r: any) => <col key={r.id} />)}
              <col style={{ width: "72px" }} />
            </colgroup>
            <thead>
              <tr className="bg-[#1B2A33]">
                {/* Startup col header */}
                <th className="text-left px-4 text-xs font-bold text-[#9BA8B0] uppercase tracking-widest sticky left-0 bg-[#1B2A33] z-10"
                  style={{ height: `${HEADER_H}px`, verticalAlign: "bottom", paddingBottom: "12px" }}>
                  Startup
                </th>
                {/* Rotated criterion headers */}
                {sortedReqs.map((r: any) => (
                  <th key={r.id} className="p-0 relative" style={{ height: `${HEADER_H}px` }}>
                    <div className="absolute bottom-2 left-1/2 origin-bottom-left"
                      style={{ transform: "rotate(-50deg) translateX(-50%)", whiteSpace: "nowrap" }}>
                      <span className="text-[11px] font-semibold text-white/80 leading-none">{r.name}</span>
                      <span className="ml-1.5 text-[10px] font-bold text-[#E8521A]">{(r.weight * 100).toFixed(0)}%</span>
                    </div>
                  </th>
                ))}
                {/* WSM total */}
                <th className="text-center text-xs font-bold text-white bg-[#E8521A] tracking-widest"
                  style={{ height: `${HEADER_H}px`, verticalAlign: "bottom", paddingBottom: "12px" }}>
                  WSM
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStartups.map((startup: any, idx: number) => {
                const ranking = rankMap[startup.id];
                const isTop = ranking?.rank === 1;
                const logo = STARTUP_LOGOS[startup.name];
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-[#FDFAF6]/40";
                return (
                  <tr key={startup.id} className={`border-b border-[#F0EBE3] hover:bg-[#FFF8F5] transition-colors ${rowBg}`}>
                    {/* Startup cell */}
                    <td className={`px-3 py-3 sticky left-0 z-10 border-r border-[#E2D9CF] ${rowBg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isTop ? "bg-[#E8521A] text-white" : "bg-[#F0EBE3] text-[#6B7A84]"}`}
                          style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                          {ranking?.rank ?? "—"}
                        </span>
                        {logo && (
                          <img src={logo} alt={startup.name}
                            className="w-6 h-6 rounded-md object-contain shrink-0 border border-[#E2D9CF] bg-white p-0.5"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1B2A33] text-xs truncate">{startup.name}</p>
                          {startup.hqCountry && <p className="text-[10px] text-[#9BA8B0]">{startup.hqCountry}</p>}
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
                              {score != null ? score : "—"}
                              {style && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: style.bar }} />}
                            </div>
                          </ScoreTooltip>
                        </td>
                      );
                    })}
                    {/* WSM total */}
                    <td className="px-2 py-3 text-center bg-[#FFF5F0]">
                      <span className="text-sm font-black text-[#E8521A]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                        {ranking?.wsmScore?.toFixed(1) ?? "—"}
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
  const [page, setPage] = useState<"context" | "rankings" | "matrix">("context");

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

  const pages = [
    { id: "context",  label: "Contexto" },
    { id: "rankings", label: "Rankings" },
    { id: "matrix",   label: "Evaluación" },
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
            {pages.map(p => (
              <button key={p.id} onClick={() => setPage(p.id)}
                className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  page === p.id ? "bg-[#E8521A] text-white shadow-sm" : "text-[#6B7A84] hover:bg-[#F5F0EA] hover:text-[#1B2A33]"
                }`}>
                {p.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Animated page content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={page} variants={pageVariants} initial="initial" animate="enter" exit="exit">
          {page === "context"  && <PageContext  data={data} onNext={() => setPage("rankings")} />}
          {page === "rankings" && <PageRankings data={data} onNext={() => setPage("matrix")} />}
          {page === "matrix"   && <PageMatrix   data={data} />}
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
