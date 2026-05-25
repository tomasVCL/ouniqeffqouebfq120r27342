import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_WHITE = "/manus-storage/vcl-logo-white_96a5cf7b.png";
const LOGO_DARK  = "/manus-storage/vcl-logo-dark_5aaa0a93.png";
const ISOTIPO    = "/manus-storage/vcl-isotipo_24d37529.png";

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

// ── Score cell colour ──────────────────────────────────────────────────────
function scoreColor(score: number | null | undefined) {
  if (score == null) return "bg-gray-50 text-gray-400";
  if (score >= 9)  return "bg-emerald-100 text-emerald-900 font-semibold";
  if (score >= 7)  return "bg-blue-50 text-blue-900";
  if (score >= 5)  return "bg-amber-50 text-amber-900";
  return "bg-red-50 text-red-900";
}

// ── Business formula definitions ───────────────────────────────────────────
const FORMULAS = [
  {
    id: "F1",
    name: "ROI de Implementación",
    description: "Retorno sobre la inversión en tecnología DPP/LCA durante el primer año operativo.",
    formula: "(ahorros + ingresos - costo) / costo × 100",
    inputs: [
      { key: "ahorros",  label: "Ahorros anuales estimados (€)",  default: 120000 },
      { key: "ingresos", label: "Ingresos adicionales (€)",        default: 80000  },
      { key: "costo",    label: "Costo total de implementación (€)", default: 150000 },
    ],
    compute: (v: Record<string, number>) =>
      ((v.ahorros + v.ingresos - v.costo) / v.costo * 100).toFixed(1) + "%",
    unit: "% ROI",
  },
  {
    id: "F2",
    name: "Costo por Digital Product Passport (DPP)",
    description: "Costo unitario de emisión de un DPP por SKU, incluyendo integración y mantenimiento anual.",
    formula: "(licencia + integración + mantenimiento) / SKUs",
    inputs: [
      { key: "licencia",       label: "Licencia anual (€)",           default: 50000 },
      { key: "integracion",    label: "Costo de integración (€)",      default: 30000 },
      { key: "mantenimiento",  label: "Mantenimiento anual (€)",       default: 15000 },
      { key: "skus",           label: "Cantidad de SKUs activos",      default: 5000  },
    ],
    compute: (v: Record<string, number>) =>
      "€" + ((v.licencia + v.integracion + v.mantenimiento) / v.skus).toFixed(2),
    unit: "€ / DPP",
  },
  {
    id: "F3",
    name: "Índice de Madurez Tecnológica",
    description: "Puntuación ponderada que combina TRL, adopción enterprise y cobertura regulatoria.",
    formula: "(TRL/9 × 0.4) + (adopción/10 × 0.35) + (regulatorio/10 × 0.25) × 100",
    inputs: [
      { key: "trl",         label: "TRL (1–9)",                       default: 7  },
      { key: "adopcion",    label: "Adopción enterprise (0–10)",       default: 7  },
      { key: "regulatorio", label: "Cobertura regulatoria (0–10)",     default: 8  },
    ],
    compute: (v: Record<string, number>) =>
      ((v.trl / 9 * 0.4) + (v.adopcion / 10 * 0.35) + (v.regulatorio / 10 * 0.25) * 100).toFixed(1),
    unit: "/ 100",
  },
  {
    id: "F4",
    name: "Período de Recuperación (Payback)",
    description: "Meses necesarios para recuperar la inversión inicial a partir de los ahorros generados.",
    formula: "inversión / (ahorros_mensuales + ingresos_mensuales)",
    inputs: [
      { key: "inversion",          label: "Inversión total (€)",                default: 180000 },
      { key: "ahorros_mensuales",  label: "Ahorros mensuales (€)",              default: 12000  },
      { key: "ingresos_mensuales", label: "Ingresos adicionales mensuales (€)", default: 5000   },
    ],
    compute: (v: Record<string, number>) =>
      (v.inversion / (v.ahorros_mensuales + v.ingresos_mensuales)).toFixed(1) + " meses",
    unit: "meses",
  },
  {
    id: "F5",
    name: "Ahorro en Auditorías de Cumplimiento",
    description: "Reducción estimada en costos de auditoría CSRD/EUDR mediante automatización.",
    formula: "costo_actual × (1 - eficiencia/100) × frecuencia",
    inputs: [
      { key: "costo_actual",  label: "Costo actual por auditoría (€)",   default: 40000 },
      { key: "eficiencia",    label: "Eficiencia de automatización (%)",  default: 70    },
      { key: "frecuencia",    label: "Auditorías por año",                default: 3     },
    ],
    compute: (v: Record<string, number>) =>
      "€" + (v.costo_actual * (1 - v.eficiencia / 100) * v.frecuencia).toLocaleString("es-ES"),
    unit: "€ / año",
  },
];

// ── Interactive Formula Card ───────────────────────────────────────────────
function FormulaCard({ f }: { f: typeof FORMULAS[0] }) {
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(f.inputs.map(i => [i.key, i.default]))
  );
  const result = f.compute(vals);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-bold text-[#E8521A] tracking-widest uppercase">{f.id}</span>
          <h4 className="text-sm font-semibold text-gray-900 mt-0.5">{f.name}</h4>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#E8521A]">{result}</div>
          <div className="text-xs text-gray-400">{f.unit}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{f.description}</p>
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
        <code className="text-xs text-gray-600 font-mono">{f.formula}</code>
      </div>
      <div className="space-y-2">
        {f.inputs.map(inp => (
          <div key={inp.key} className="flex items-center gap-3">
            <label className="text-xs text-gray-600 flex-1 min-w-0 truncate">{inp.label}</label>
            <input
              type="number"
              value={vals[inp.key]}
              onChange={e => setVals(v => ({ ...v, [inp.key]: parseFloat(e.target.value) || 0 }))}
              className="w-28 text-right text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E8521A] bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Hover Tooltip ─────────────────────────────────────────────────────────
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

// ── Startup Hover Card ─────────────────────────────────────────────────────
function StartupHoverCard({ startup, children }: { startup: any; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <span
      className="relative inline-block"
      onMouseEnter={e => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left, y: rect.bottom });
        setShow(true);
      }}
      onMouseLeave={() => setShow(false)}
    >
      <span className="underline decoration-dotted underline-offset-2 cursor-pointer text-gray-900 hover:text-[#E8521A] transition-colors font-medium">
        {children}
      </span>
      {show && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72 pointer-events-none"
          style={{ left: Math.min(pos.x, window.innerWidth - 300), top: pos.y + 4 }}
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

  // Indispensable: mandatory=true OR name contains "TRL" OR name contains "Madurez"
  const indispensable = requirements.filter(
    (r: any) => r.mandatory || r.name?.toLowerCase().includes("trl") || r.name?.toLowerCase().includes("madurez")
  );
  const deseable = requirements.filter(
    (r: any) => !r.mandatory && !r.name?.toLowerCase().includes("trl") && !r.name?.toLowerCase().includes("madurez")
  );

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-center gap-3 mb-10">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-8" />
          </div>
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-3">
                Discover Phase — Reporte Ejecutivo
              </div>
              <h1 className="text-3xl font-bold leading-tight mb-4 text-gray-900">{project.title}</h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
                {project.scopeDescription}
              </p>
            </div>
            <div className="bg-[#FDF6EE] border border-orange-100 rounded-xl p-5 min-w-[200px] text-sm space-y-3">
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Cliente</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.clientName}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Industria</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.industry}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Analista</div>
                <div className="text-gray-900 font-medium mt-0.5">{project.analystName}</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Startups evaluadas",   value: project.universeSize ?? 10 },
            { label: "Startups elegibles",   value: project.eligibleCount ?? 8 },
            { label: "Excluidas",            value: project.excludedCount ?? 2 },
            { label: "Criterios ponderados", value: requirements.length },
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
              <div className="text-sm text-gray-700">{project.geoExcluded}</div>
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
            Este análisis utiliza una <strong>Weighted Scoring Matrix (WSM)</strong> con {requirements.length} criterios ponderados que cubren las dimensiones técnicas, regulatorias, comerciales y estratégicas más relevantes para la adopción de tecnología DPP/LCA en cadenas de suministro textil complejas. Cada startup fue evaluada de forma independiente con puntuaciones del 1 al 10, ponderadas según la importancia relativa de cada criterio.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {requirements.map((r: any) => (
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
            Ver Rankings Finales
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
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-7" />
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-2">
            Sección C — Rankings Finales
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Selección Estratégica y Técnica</h2>
          <p className="text-gray-500 text-sm mt-2">
            Ranking final por Weighted Scoring Matrix (WSM). Pasa el cursor sobre el nombre de una startup para ver su perfil.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Strategic Clusters — AL TOPE */}
        {clusters.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Strategic Clusters</h3>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Empresa</th>
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
                        <span className="text-xs text-gray-600 leading-relaxed">{startup?.strategicFit ?? "—"}</span>
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
                const isRec = row.rec?.decision === "recommended";
                return (
                  <div key={row.startupId}
                    className="bg-white rounded-xl p-5 shadow-sm border-l-4"
                    style={{ borderColor, borderTopColor: "#e5e7eb", borderRightColor: "#e5e7eb", borderBottomColor: "#e5e7eb" }}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                      <span className="font-bold text-sm text-gray-900">#{row.rank} {row.startup?.name}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.bg} ${tier.text}`}>{tier.short}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isRec ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>{isRec ? "✓ Recomendado" : "✗ No recomendado"}</span>
                      </div>
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

  const scoreMap: Record<number, Record<number, any>> = {};
  for (const score of wsmScores) {
    if (!scoreMap[score.startupId]) scoreMap[score.startupId] = {};
    scoreMap[score.startupId][score.requirementId] = score;
  }

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-7" />
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-2">
            Evaluación Detallada
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Matriz de Evaluación</h2>
          <p className="text-gray-500 text-sm mt-2">
            Puntuaciones individuales por criterio. Pasa el cursor sobre cada celda para ver el razonamiento del analista.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs">
          {[
            { label: "9–10 Excelente",  bg: "bg-emerald-100", text: "text-emerald-900" },
            { label: "7–8 Bueno",       bg: "bg-blue-50",     text: "text-blue-900"    },
            { label: "5–6 Aceptable",   bg: "bg-amber-50",    text: "text-amber-900"   },
            { label: "1–4 Bajo",        bg: "bg-red-50",      text: "text-red-900"     },
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
                  {requirements.map((r: any) => (
                    <th key={r.id} className="px-2 py-3 font-semibold text-center min-w-[110px]">
                      <div className="whitespace-normal leading-tight text-center">{r.name}</div>
                      <div className="text-gray-400 font-normal mt-0.5">{(r.weight * 100).toFixed(0)}%</div>
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
                          <div>
                            <div className="font-semibold text-gray-900">{startup.name}</div>
                            <div className="text-gray-400 truncate max-w-[100px]">{startup.hqCountry}</div>
                          </div>
                        </div>
                      </td>
                      {requirements.map((r: any) => {
                        const entry = scoreMap[startup.id]?.[r.id];
                        const score = entry?.humanScore ?? entry?.aiScore;
                        return (
                          <td key={r.id} className="px-1 py-1 text-center">
                            <RationaleTooltip rationale={entry?.rationale}>
                              <span className={`inline-flex items-center justify-center w-full h-8 rounded text-sm font-semibold ${scoreColor(score)}`}>
                                {score != null ? score : "—"}
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
          Puntuaciones asignadas por el equipo de análisis de VCL Studio. Cada puntuación refleja una evaluación independiente basada en documentación pública, demos y entrevistas con los proveedores.
        </p>
      </div>
    </div>
  );
}

// ── Page 4: Anexos ─────────────────────────────────────────────────────────
function PageAnexos({ data }: { data: any }) {
  const { project } = data;

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-7" />
          </div>
          <div className="text-xs font-semibold tracking-[0.2em] text-[#E8521A] uppercase mb-2">
            Anexos
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Herramientas y Material de Apoyo</h2>
          <p className="text-gray-500 text-sm mt-2">
            Fórmulas de negocio interactivas y material complementario del análisis.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Fórmulas de negocio */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Fórmulas de Negocio</h3>
          <p className="text-sm text-gray-500 mb-5">
            Herramientas cuantitativas para evaluar el impacto económico de la implementación. Ajusta los parámetros para ver los resultados en tiempo real.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORMULAS.map(f => <FormulaCard key={f.id} f={f} />)}
          </div>
        </div>

        {/* Nota metodológica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Nota Metodológica</h3>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              Las fórmulas presentadas en esta sección son herramientas orientativas para facilitar la toma de decisiones. Los valores por defecto están calibrados con benchmarks del sector textil europeo para proyectos de implementación DPP/LCA de escala media.
            </p>
            <p>
              Los resultados deben interpretarse como estimaciones preliminares. VCL Studio recomienda validar los parámetros con los equipos financieros y técnicos del cliente antes de utilizarlos en decisiones de inversión.
            </p>
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Análisis elaborado por el equipo de Innovación / Venture Clienting de VCL Studio · {project?.reportDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ClientPortalV2() {
  const params = useParams<{ projectId: string }>();
  const projectId = parseInt(params.projectId ?? "0", 10);

  const [passkey, setPasskey] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState<"context" | "rankings" | "matrix" | "anexos">("context");

  // Scroll al tope al cambiar de página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  const { data, isLoading, error } = trpc.report.getByPasskey.useQuery(
    { projectId, passkey: submitted },
    { enabled: submitted.length > 0, retry: false }
  );

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(passkey.trim());
  };

  // Pantalla de acceso
  if (!submitted || error) {
    return (
      <div className="h-screen w-full bg-[#FDF6EE] flex flex-col items-center justify-center px-4">
        <div className="mb-10 text-center">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-10 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Innovation Scouting Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#E8521A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#E8521A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Acceso al Reporte</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa la clave de acceso proporcionada por VCL Studio</p>
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
        <p className="text-gray-600 text-xs mt-6">
          ¿Problemas de acceso? Contacta a{" "}
          <a href="mailto:innovation@vclstudio.com" className="text-[#E8521A] hover:underline">
            innovation@vclstudio.com
          </a>
        </p>
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

  if (!data) return null;

  const pages = [
    { id: "context",  label: "Contexto" },
    { id: "rankings", label: "Rankings" },
    { id: "matrix",   label: "Evaluación" },
    { id: "anexos",   label: "Anexos" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDF6EE]">
      {/* Nav fija */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-6" />
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

      {/* Contenido de página */}
      {page === "context"  && <PageContext  data={data} onNextPage={() => setPage("rankings")} />}
      {page === "rankings" && <PageRankings data={data} onNext={() => setPage("matrix")} />}
      {page === "matrix"   && <PageMatrix   data={data} />}
      {page === "anexos"   && <PageAnexos   data={data} />}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 text-gray-400 text-xs py-6 mt-0">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ISOTIPO} alt="VCL" className="h-5 opacity-50" />
            <span>© {new Date().getFullYear()} VCL Studio. Confidencial.</span>
          </div>
          <span>{data.project.reportDate}</span>
        </div>
      </footer>
    </div>
  );
}
