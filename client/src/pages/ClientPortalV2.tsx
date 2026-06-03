import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_DARK   = "/vcl-logo-dark.webp";
const ISOTIPO     = "/vcl-isotipo.webp";

const GF = (d: string) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${d}&size=128`;

const STARTUP_LOGOS: Record<string, string> = {
  // BAC — Última Milla
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
  // ITC — DPP & LCA
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

// ── Tier config ────────────────────────────────────────────────────────────
const TIER_CONFIG: Record<number, { label: string; short: string; bg: string; text: string; dot: string }> = {
  1: { label: "TIER 1 — TOP PICK", short: "TOP PICK", bg: "bg-emerald-50",  text: "text-emerald-800", dot: "bg-emerald-500" },
  2: { label: "TIER 2 — STRONG",   short: "STRONG",   bg: "bg-blue-50",     text: "text-blue-800",    dot: "bg-blue-500"   },
  3: { label: "TIER 3 — VIABLE",   short: "VIABLE",   bg: "bg-amber-50",    text: "text-amber-800",   dot: "bg-amber-500"  },
  4: { label: "TIER 4 — MONITOR",  short: "MONITOR",  bg: "bg-red-50",      text: "text-red-800",     dot: "bg-red-400"    },
};

const TIER_BORDER: Record<number, string> = {
  1: "#10b981",
  2: "#3b82f6",
  3: "#f59e0b",
  4: "#f87171",
};

// ── Score cell colour — escala 0-4 ────────────────────────────────────────
function scoreColor(score: number | null | undefined) {
  if (score == null) return "bg-gray-50 text-gray-400";
  if (score === 0)   return "bg-gray-200 text-gray-500";
  if (score === 4)   return "bg-emerald-100 text-emerald-900 font-semibold";
  if (score === 3)   return "bg-blue-50 text-blue-900";
  if (score === 2)   return "bg-amber-50 text-amber-900";
  return "bg-red-50 text-red-900";
}

// ── Hover Tooltip (rationale) ──────────────────────────────────────────────
function RationaleTooltip({ children, rationale }: { children: React.ReactNode; rationale: string | null | undefined }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center justify-center w-full h-full cursor-help"
      onMouseEnter={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && rationale && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs pointer-events-none"
          style={{ left: Math.min(pos.x - 100, window.innerWidth - 220), top: pos.y - 8, transform: "translateY(-100%)" }}
        >
          {rationale}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// ── Requirement header tooltip ─────────────────────────────────────────────
function ReqHeaderTooltip({ req, children }: { req: any; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <span
      className="inline-block cursor-help w-full"
      onMouseEnter={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && req.description && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs pointer-events-none"
          style={{ left: Math.min(Math.max(pos.x - 100, 8), window.innerWidth - 228), top: pos.y - 8, transform: "translateY(-100%)" }}
        >
          {req.description}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
}

// ── Startup Hover Card ─────────────────────────────────────────────────────
function StartupHoverCard({ startup, children }: { startup: any; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  function clearTimer() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }

  function scheduleHide() {
    clearTimer();
    hideTimer.current = setTimeout(() => setShow(false), 150);
  }

  function handleEnterTrigger(e: React.MouseEvent) {
    clearTimer();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ x: rect.left, y: rect.bottom });
    setShow(true);
  }

  const nameClass = "underline decoration-dotted underline-offset-2 cursor-pointer text-gray-900 hover:text-[#E8521A] transition-colors font-medium";

  return (
    <span className="relative inline-block">
      {startup?.websiteUrl ? (
        <a
          href={startup.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={nameClass}
          onMouseEnter={handleEnterTrigger}
          onMouseLeave={scheduleHide}
        >
          {children}
        </a>
      ) : (
        <span
          className={nameClass}
          onMouseEnter={handleEnterTrigger}
          onMouseLeave={scheduleHide}
        >
          {children}
        </span>
      )}
      {show && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72"
          style={{ left: Math.min(pos.x, window.innerWidth - 300), top: pos.y + 4 }}
          onMouseEnter={clearTimer}
          onMouseLeave={scheduleHide}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{startup.name}</div>
              <div className="text-xs text-gray-500">{startup.description}</div>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 ml-2 whitespace-nowrap">
              {startup.foundedYear}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2">
            <div className="text-gray-400">HQ</div>
            <div className="text-gray-700">{startup.hqCity}, {startup.hqCountry}</div>
            <div className="text-gray-400">Empleados</div>
            <div className="text-gray-700">{startup.employeeRange}</div>
            <div className="text-gray-400">Stage</div>
            <div className="text-gray-700">{startup.fundingStage}</div>
            <div className="text-gray-400">Funding</div>
            <div className="text-gray-700">{startup.fundingAmount || "N/A"}</div>
            {startup.clientsRef && (
              <>
                <div className="text-gray-400">Clientes ref.</div>
                <div className="text-gray-700 truncate">{startup.clientsRef}</div>
              </>
            )}
            {startup.investors && (
              <>
                <div className="text-gray-400">Inversores</div>
                <div className="text-gray-700 truncate">{startup.investors}</div>
              </>
            )}
          </div>
          {startup.keyDifferentiator && (
            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 italic">
              {startup.keyDifferentiator}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ── Page 1: Contexto ───────────────────────────────────────────────────────
function PageContext({ data, onNextPage }: { data: any; onNextPage: () => void }) {
  const { project, requirements } = data;

  const indispensable = requirements.filter(
    (r: any) => r.mandatory || r.name?.toLowerCase().includes("trl") || r.name?.toLowerCase().includes("madurez")
  );
  const deseable = requirements.filter(
    (r: any) => !r.mandatory && !r.name?.toLowerCase().includes("trl") && !r.name?.toLowerCase().includes("madurez")
  );

  const sortedRequirements = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center justify-between gap-3 mb-10">
            <img src={LOGO_DARK} alt="VCL studio" className="h-14 object-contain" />
            {project.clientLogoUrl && (
              <img src={project.clientLogoUrl} alt={project.clientName} className="h-10 object-contain opacity-90" />
            )}
          </div>
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-3">
                Reporte de Scouting
              </div>
              <h1 className="text-3xl font-bold leading-tight mb-4 text-gray-900">{project.title}</h1>
              {project.scopeDescription && (
                <p className="text-gray-500 text-sm leading-relaxed max-w-xl">{project.scopeDescription}</p>
              )}
            </div>
            <div className="bg-[#FDF6EE] border border-orange-100 rounded-xl p-5 min-w-[200px] text-sm space-y-3">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Empresa</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.clientName}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Industria</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.industry}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Analista</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.analystName ?? "Equipo de Analistas de VCL studio"}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Fecha</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.reportDate}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Startups evaluadas",       value: project.universeSize ?? 10 },
            { label: "Criterios de evaluación",  value: requirements.length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
              <div className="text-3xl font-bold text-[#E8521A]">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alcance geográfico */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Alcance Geográfico</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Incluido</div>
              <div className="text-sm text-gray-700">{project.geoAllowed}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Excluido</div>
              <div className="text-sm text-gray-700">{project.geoExcluded || "—"}</div>
            </div>
          </div>
        </div>

        {/* Criterios de evaluación */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-5">Criterios de Evaluación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {indispensable.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="text-xs font-bold text-[#E8521A] uppercase tracking-widest mb-3">Indispensable</div>
                <div className="space-y-3">
                  {indispensable.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8521A] mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        {r.description && <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {deseable.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">Deseable</div>
                <div className="space-y-3">
                  {deseable.map((r: any) => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.name}</div>
                        {r.description && <div className="text-xs text-gray-500 mt-0.5">{r.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metodología */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Metodología</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Este análisis utiliza una <strong>Weighted Scoring Matrix (WSM)</strong> con {requirements.length} criterios ponderados. Cada startup fue evaluada de forma independiente con puntuaciones del 0 al 4, ponderadas según la importancia relativa de cada criterio.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {sortedRequirements.map((r: any) => (
              <div key={r.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-[#E8521A]">{(r.weight * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-700 font-medium leading-tight mt-0.5">{r.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA a Página 2 */}
        <div className="flex justify-center pt-6 pb-2">
          <button
            onClick={onNextPage}
            className="inline-flex items-center gap-2 bg-[#E8521A] hover:bg-[#CC4415] text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm text-sm"
          >
            Ver Rankings
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page 2: Rankings ───────────────────────────────────────────────────────
function PageRankings({ data, onNext }: { data: any; onNext: () => void }) {
  const { rankings, startups, clusters, recommendations } = data;
  const startupMap = Object.fromEntries(startups.map((s: any) => [s.id, s]));
  const clusterMap = Object.fromEntries(clusters.map((c: any) => [c.id, c]));
  const recMap = Object.fromEntries((recommendations ?? []).map((r: any) => [r.startupId, r]));

  const enriched = [...rankings]
    .sort((a: any, b: any) => (a.rank ?? 99) - (b.rank ?? 99))
    .map((r: any) => ({
      ...r,
      startup: startupMap[r.startupId],
      rec: recMap[r.startupId],
    }));

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <img src={LOGO_DARK} alt="VCL studio" className="h-12 object-contain" />
            {data.project.clientLogoUrl && (
              <img src={data.project.clientLogoUrl} alt={data.project.clientName} className="h-9 object-contain opacity-90" />
            )}
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-2">
            Rankings Finales
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Selección Estratégica y Técnica</h2>
          <p className="text-gray-500 text-sm mt-2">
            Ranking final por Weighted Scoring Matrix (WSM). Pasa el cursor sobre el nombre de una startup para ver su perfil, o haz clic para visitar su sitio web.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Clusteres Estratégicos */}
        {clusters.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Clústeres Estratégicos</h3>
            <p className="text-sm text-gray-500 mb-4">Agrupación estratégica de las startups evaluadas según su perfil tecnológico y de mercado.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {clusters.map((c: any) => {
                const members = startups.filter((s: any) => s.clusterId === c.id);
                return (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || "#C0392B" }} />
                      <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mb-3">{c.description}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((s: any) => (
                        <span key={s.id} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">{s.name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leyenda de tiers */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-2 ${cfg.bg} ${cfg.text} text-xs font-semibold px-3 py-1.5 rounded-full border border-current/20`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Startup</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cluster</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Puntuación WSM</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Diferenciador Clave</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((row: any, idx: number) => {
                  const tierNum = typeof row.tier === "number" ? row.tier : 4;
                  const tier = TIER_CONFIG[tierNum] ?? TIER_CONFIG[4];
                  const startup = row.startup;
                  const cluster = startup?.clusterId ? clusterMap[startup.clusterId] : null;
                  return (
                    <tr key={row.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${idx === 0 ? "bg-[#E8521A] text-white" : "bg-gray-100 text-gray-600"}`}>
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {startup && STARTUP_LOGOS[startup.name] && (
                            <img
                              src={STARTUP_LOGOS[startup.name]}
                              alt={startup.name}
                              className="w-8 h-8 rounded-lg object-contain flex-shrink-0 border border-gray-100 bg-white p-0.5"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <div>
                            {startup ? (
                              <StartupHoverCard startup={startup}>
                                {startup.name}
                              </StartupHoverCard>
                            ) : (
                              <span className="font-medium text-gray-900">—</span>
                            )}
                            {startup?.description && (
                              <div className="text-xs text-gray-400 mt-0.5">{startup.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {cluster ? (
                          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                            {cluster.name}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-base font-bold text-gray-900">{row.wsmScore?.toFixed(2) ?? "—"}</span>
                        <span className="text-xs text-gray-400 ml-1">/ 10</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tier.bg} ${tier.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                          {tier.short}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-gray-600 leading-relaxed">{startup?.keyDifferentiator ?? "—"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recomendaciones del analista */}
        {enriched.some((r: any) => r.rec?.narrative) && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Recomendaciones del Analista</h3>
            <p className="text-sm text-gray-500 mb-5">Evaluación individual y recomendación estratégica por cada startup analizada.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enriched.filter((r: any) => r.rec?.narrative).map((row: any) => {
                const tierNum = typeof row.tier === "number" ? row.tier : parseInt(row.tier ?? "4", 10);
                const tier = TIER_CONFIG[tierNum] ?? TIER_CONFIG[4];
                const borderColor = TIER_BORDER[tierNum] ?? "#e5e7eb";
                return (
                  <div key={row.startupId}
                    className="bg-white rounded-xl p-5 shadow-sm border-l-4"
                    style={{ borderColor, borderTopColor: "#e5e7eb", borderRightColor: "#e5e7eb", borderBottomColor: "#e5e7eb" }}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <span className="font-bold text-sm text-gray-900">#{row.rank} {row.startup?.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>{tier.short}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">{row.rec.narrative}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA a Página 3 */}
        <div className="flex justify-center pt-6 pb-2">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 bg-[#E8521A] hover:bg-[#CC4415] text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-sm text-sm"
          >
            Ver Matriz de Evaluación Detallada
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page 3: Matriz de evaluación ───────────────────────────────────────────
function PageMatrix({ data }: { data: any }) {
  const { requirements, startups, wsmScores, rankings } = data;

  const rankMap = Object.fromEntries(rankings.map((r: any) => [r.startupId, r]));
  const sortedStartups = [...startups]
    .filter((s: any) => s.eligible !== false)
    .sort((a: any, b: any) => {
      const ra = rankMap[a.id]?.rank ?? 99;
      const rb = rankMap[b.id]?.rank ?? 99;
      return ra - rb;
    });

  const sortedRequirements = [...requirements].sort((a: any, b: any) => (b.weight ?? 0) - (a.weight ?? 0));

  const scoreMap: Record<number, Record<number, any>> = {};
  for (const score of wsmScores) {
    if (!scoreMap[score.startupId]) scoreMap[score.startupId] = {};
    scoreMap[score.startupId][score.requirementId] = score;
  }

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <img src={LOGO_DARK} alt="VCL studio" className="h-12 object-contain" />
            {data.project.clientLogoUrl && (
              <img src={data.project.clientLogoUrl} alt={data.project.clientName} className="h-9 object-contain opacity-90" />
            )}
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-2">
            Evaluación Detallada
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Matriz de Evaluación</h2>
          <p className="text-gray-500 text-sm mt-2">
            Puntuaciones individuales por criterio (escala 0–4). Pasa el cursor sobre el nombre de un criterio para ver su descripción, o sobre una puntuación para ver el razonamiento del analista.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Leyenda escala 0-4 */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs">
          {[
            { label: "4 — Excelente", bg: "bg-emerald-100", text: "text-emerald-900" },
            { label: "3 — Bueno",     bg: "bg-blue-50",     text: "text-blue-900"   },
            { label: "2 — Regular",   bg: "bg-amber-50",    text: "text-amber-900"  },
            { label: "1 — Débil",     bg: "bg-red-50",      text: "text-red-900"    },
            { label: "0 — Ausente",   bg: "bg-gray-200",    text: "text-gray-500"   },
          ].map(l => (
            <span key={l.label} className={`${l.bg} ${l.text} px-3 py-1 rounded-full font-medium`}>{l.label}</span>
          ))}
          <span className="text-gray-400 ml-2 self-center">Pasa el cursor sobre una puntuación para ver el razonamiento</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-gray-900 z-10 min-w-[140px]">Startup</th>
                  {sortedRequirements.map((r: any) => (
                    <th key={r.id} className="px-2 py-3 font-semibold text-center min-w-[110px]">
                      <ReqHeaderTooltip req={r}>
                        <div className="whitespace-normal leading-tight text-center">{r.name}</div>
                        <div className="text-gray-400 font-normal mt-0.5">{(r.weight * 100).toFixed(0)}%</div>
                      </ReqHeaderTooltip>
                    </th>
                  ))}
                  <th className="px-3 py-3 font-semibold text-center bg-[#E8521A] min-w-[80px]">WSM Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedStartups.map((startup: any, idx: number) => {
                  const ranking = rankMap[startup.id];
                  return (
                    <tr key={startup.id} className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                      <td className="px-4 py-3 sticky left-0 bg-inherit z-10 border-r border-gray-100">
                        <div className="flex items-center gap-2">
                          {ranking && (
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? "bg-[#E8521A] text-white" : "bg-gray-100 text-gray-600"}`}>
                              {ranking.rank}
                            </span>
                          )}
                          {STARTUP_LOGOS[startup.name] && (
                            <img
                              src={STARTUP_LOGOS[startup.name]}
                              alt={startup.name}
                              className="w-6 h-6 rounded object-contain flex-shrink-0 border border-gray-100 bg-white p-0.5"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{startup.name}</div>
                            <div className="text-gray-400 truncate max-w-[100px]">{startup.hqCountry}</div>
                          </div>
                        </div>
                      </td>
                      {sortedRequirements.map((r: any) => {
                        const entry = scoreMap[startup.id]?.[r.id];
                        const rawScore = entry?.humanScore ?? entry?.aiScore;
                        const displayScore = rawScore != null ? Math.min(4, Math.max(0, Math.round(rawScore / 2.5))) : null;
                        return (
                          <td key={r.id} className="px-1 py-1 text-center">
                            <RationaleTooltip rationale={entry?.rationale}>
                              <span className={`inline-flex items-center justify-center w-full h-8 rounded text-sm font-semibold ${scoreColor(displayScore)}`}>
                                {displayScore != null ? displayScore : "—"}
                              </span>
                            </RationaleTooltip>
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-center bg-red-50/30">
                        <span className="text-sm font-bold text-[#E8521A]">
                          {ranking?.wsmScore?.toFixed(2) ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Puntuaciones asignadas por el equipo de análisis de VCL studio. Cada puntuación refleja una evaluación independiente basada en documentación pública.
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ClientPortalV2() {
  const params = useParams<{ projectId?: string; clientSlug?: string; problemId?: string }>();

  const sessionKey = params.clientSlug && params.problemId
    ? `vcl_report_${params.clientSlug}_${params.problemId}`
    : params.projectId
    ? `vcl_report_legacy_${params.projectId}`
    : null;

  const sessionData = sessionKey ? (() => {
    try { return JSON.parse(sessionStorage.getItem(sessionKey) ?? ""); } catch { return null; }
  })() : null;

  const projectId = sessionData?.projectId ?? parseInt(params.projectId ?? "0", 10);
  const isSlugRoute = !!(params.clientSlug && params.problemId);

  const [passkey, setPasskey] = useState("");
  const [submitted, setSubmitted] = useState<string>(sessionData?.passkey ?? "");
  const [page, setPage] = useState<"context" | "rankings" | "matrix">("context");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  const slugQuery = trpc.report.getBySlug.useQuery(
    { clientSlug: params.clientSlug ?? "", problemId: params.problemId ?? "" },
    { enabled: isSlugRoute, retry: false }
  );

  const passkeyQuery = trpc.report.getByPasskey.useQuery(
    { projectId, passkey: submitted },
    { enabled: !isSlugRoute && submitted.length > 0 && projectId > 0, retry: false }
  );

  const { data, isLoading, error } = isSlugRoute ? slugQuery : passkeyQuery;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(passkey.trim());
  };



  if (!isSlugRoute && (!submitted || error)) {
    return (
      <div className="h-screen w-full bg-[#FDF6EE] flex flex-col items-center justify-center px-4">
        <div className="mb-10 text-center">
          <img src={LOGO_DARK} alt="VCL studio" className="h-16 object-contain mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Scouting</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#E8521A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#E8521A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Acceso al Reporte</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa la clave de acceso proporcionada por VCL studio</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={passkey}
              onChange={e => setPasskey(e.target.value)}
              placeholder="Clave de acceso"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8521A] focus:border-transparent"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600 text-center">Clave incorrecta. Por favor intenta de nuevo.</p>
            )}
            <button
              type="submit"
              disabled={isLoading || passkey.length === 0}
              className="w-full bg-[#E8521A] hover:bg-[#CC4415] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {isLoading ? "Verificando..." : "Acceder al Reporte"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF6EE] flex items-center justify-center">
        <div className="text-center">
          <img src={ISOTIPO} alt="VCL" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500 text-sm">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    if (error) {
      return (
        <div className="h-screen bg-[#FDF6EE] flex flex-col items-center justify-center px-4">
          <img src={LOGO_DARK} alt="VCL studio" className="h-8 mx-auto mb-4" />
          <p className="text-gray-600 text-sm mb-4 text-center">No se pudo cargar el reporte. Verifica tu clave de acceso.</p>
          <a href="/acceso" className="text-[#E8521A] font-semibold text-sm underline">Volver al acceso</a>
        </div>
      );
    }
    return null;
  }

  const pages = [
    { id: "context",  label: "Contexto" },
    { id: "rankings", label: "Rankings" },
    { id: "matrix",   label: "Evaluación" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      {/* Nav fija */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={LOGO_DARK} alt="VCL studio" className="h-8 object-contain" />
            <span className="text-xs text-gray-400 hidden sm:block">|</span>
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[200px]">{data.project.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {pages.map(p => (
              <button
                key={p.id}
                onClick={() => setPage(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  page === p.id
                    ? "bg-[#E8521A] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {page === "context"  && <PageContext  data={data} onNextPage={() => setPage("rankings")} />}
      {page === "rankings" && <PageRankings data={data} onNext={() => setPage("matrix")} />}
      {page === "matrix"   && <PageMatrix   data={data} />}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 text-gray-400 text-xs py-6 mt-0">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ISOTIPO} alt="VCL" className="h-5 opacity-50" />
            <span>© {new Date().getFullYear()} VCL studio. Confidencial.</span>
          </div>
          <span>{data.project.reportDate}</span>
        </div>
      </footer>
    </div>
  );
}
