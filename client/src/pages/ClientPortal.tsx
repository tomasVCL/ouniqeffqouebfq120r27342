import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2, Lock, ChevronRight, ChevronLeft,
  MapPin, Calendar, Users, TrendingUp, DollarSign, Building2, Info,
} from "lucide-react";

const LOGO_WHITE = "/manus-storage/vcl-logo-white_96a5cf7b.png";
const LOGO_DARK  = "/manus-storage/vcl-logo-dark_5aaa0a93.png";
const ISOTIPO    = "/manus-storage/vcl-isotipo_24d37529.png";

// ─── Tier config ──────────────────────────────────────────────────────────
const TIER: Record<number, { label: string; bg: string; text: string; border: string; rowBg: string }> = {
  1: { label: "TIER 1 — TOP PICK",  bg: "#166534", text: "#fff", border: "#16a34a", rowBg: "#f0fdf4" },
  2: { label: "TIER 2 — STRONG",    bg: "#1e40af", text: "#fff", border: "#3b82f6", rowBg: "#eff6ff" },
  3: { label: "TIER 3 — VIABLE",    bg: "#92400e", text: "#fff", border: "#f59e0b", rowBg: "#fffbeb" },
  4: { label: "TIER 4 — MONITOR",   bg: "#7f1d1d", text: "#fff", border: "#ef4444", rowBg: "#fef2f2" },
};

// ─── Types ────────────────────────────────────────────────────────────────
interface Startup {
  id: number;
  name: string;
  tagline?: string | null;
  hqCity?: string | null;
  hqCountry?: string | null;
  foundedYear?: number | null;
  fundingStage?: string | null;
  employeeRange?: string | null;
  clientsRef?: string | null;
  investors?: string | null;
  strategicFit?: string | null;
  keyDifferentiator?: string | null;
  eligible: boolean;
}
interface Ranking {
  startupId: number;
  rank?: number | null;
  compositeScore?: number | null;
  wsmScore?: number | null;
  pughNormalized?: number | null;
  capfitAvg?: number | null;
  tier?: number | null;
}
interface Recommendation {
  startupId: number;
  narrative?: string | null;
  aiDraft?: string | null;
  decision?: string | null;
}
interface ReportData {
  project: {
    title: string;
    clientName: string;
    industry?: string | null;
    geoAllowed?: string | null;
    geoExcluded?: string | null;
    reportDate?: string | null;
    analystName?: string | null;
    analystEmail?: string | null;
  };
  requirements: Array<{ name: string; description?: string | null; weight: number; category?: string | null }>;
  startups: Startup[];
  rankings: Ranking[];
  recommendations: Recommendation[];
}

// ─── Passkey Gate ─────────────────────────────────────────────────────────
function PasskeyGate({ projectId, onUnlock }: { projectId: number; onUnlock: (k: string) => void }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    try {
      await utils.report.getByPasskey.fetch({ projectId, passkey: key.trim() });
      onUnlock(key.trim());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(msg.includes("UNAUTHORIZED") || msg.includes("NOT_FOUND")
        ? "Incorrect passkey. Please try again."
        : "Unable to access report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1625 0%, #292432 60%, #1e1a2e 100%)" }}>
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(234,88,12,0.08) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <img src={ISOTIPO} alt="VCL Studio" className="h-20 w-auto mx-auto drop-shadow-lg" />
          <img src={LOGO_WHITE} alt="VCL Studio" className="h-9 w-auto mx-auto opacity-90" />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Innovation Scouting Platform — Confidential Report
          </p>
        </div>

        <div className="rounded-2xl border p-8 space-y-5"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)" }}>
          <div>
            <h1 className="text-xl font-bold text-white">Access Report</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
              Enter the passkey provided by your VCL Studio analyst.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,0.35)" }} />
              <Input
                type="password"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="Enter passkey"
                className="pl-9 h-11 text-white placeholder:text-white/30"
                style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-11 font-semibold"
              style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
              disabled={loading || !key.trim()}>
              {loading
                ? <Loader2 className="animate-spin mr-2" size={16} />
                : <Lock size={15} className="mr-2" />}
              Unlock Report
            </Button>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          VCL Studio · Innovation Scouting · Strictly Confidential
        </p>
      </div>
    </div>
  );
}

// ─── Startup Hover Card ───────────────────────────────────────────────────
function HoverCard({ startup, children }: { startup: Startup; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <span className="cursor-help font-semibold underline decoration-dotted underline-offset-2"
        style={{ color: "#1e293b" }}>
        {children}
      </span>
      {show && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-80 rounded-xl border shadow-2xl p-4 space-y-3 text-sm"
          style={{ background: "white", borderColor: "#e2e8f0", boxShadow: "0 20px 40px -8px rgba(0,0,0,0.18)" }}>
          <div className="border-b pb-2.5" style={{ borderColor: "#f1f5f9" }}>
            <div className="font-bold text-base" style={{ color: "#0f172a" }}>{startup.name}</div>
            {startup.tagline && (
              <div className="text-xs mt-0.5 leading-relaxed" style={{ color: "#64748b" }}>{startup.tagline}</div>
            )}
          </div>
          <div className="space-y-1.5">
            {(startup.hqCity || startup.hqCountry) && (
              <Row icon={<MapPin size={12} />} label={[startup.hqCity, startup.hqCountry].filter(Boolean).join(", ")} />
            )}
            {startup.foundedYear && <Row icon={<Calendar size={12} />} label={`Founded ${startup.foundedYear}`} />}
            {startup.employeeRange && <Row icon={<Users size={12} />} label={`${startup.employeeRange} employees`} />}
            {startup.fundingStage && <Row icon={<TrendingUp size={12} />} label={startup.fundingStage} />}
            {startup.clientsRef && <Row icon={<Building2 size={12} />} label={`Clients: ${startup.clientsRef}`} />}
            {startup.investors && <Row icon={<DollarSign size={12} />} label={`Investors: ${startup.investors}`} />}
          </div>
          {startup.keyDifferentiator && (
            <div className="rounded-lg p-2.5 text-xs leading-relaxed"
              style={{ background: "#fff7ed", color: "#431407", borderLeft: "3px solid oklch(62.8% 0.218 38.4)" }}>
              <span className="font-semibold">Key Differentiator: </span>{startup.keyDifferentiator}
            </div>
          )}
          <div className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
            <Info size={10} />Hover card
          </div>
        </div>
      )}
    </div>
  );
}
function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0" style={{ color: "oklch(62.8% 0.218 38.4)" }}>{icon}</span>
      <span style={{ color: "#475569" }}>{label}</span>
    </div>
  );
}

// ─── Page 1: Context ──────────────────────────────────────────────────────
function ContextPage({ data, onNext }: { data: ReportData; onNext: () => void }) {
  const { project, requirements, startups } = data;
  const mustHaves   = requirements.filter(r => r.category === "Must");
  const shouldHaves = requirements.filter(r => r.category === "Should");
  const eligible    = startups.filter(s => s.eligible);
  const excluded    = startups.filter(s => !s.eligible);

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b shadow-sm bg-white" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-7 w-auto" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: "#fff7ed", color: "#c2410c" }}>Confidential</span>
            <Button onClick={onNext} size="sm"
              style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
              Analysis <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <img src={ISOTIPO} alt="" className="h-14 w-auto shrink-0 mt-1" />
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "oklch(62.8% 0.218 38.4)" }}>
                VCL Studio · Innovation Scouting
              </div>
              <h1 className="text-3xl font-black leading-tight mt-0.5" style={{ color: "#0f172a" }}>
                {project.title}
              </h1>
            </div>
          </div>
          {/* Meta strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {[
              { label: "Client",      value: project.clientName },
              { label: "Industry",    value: project.industry },
              { label: "Report Date", value: project.reportDate },
              { label: "Analyst",     value: project.analystName },
            ].filter(m => m.value).map(m => (
              <div key={m.label} className="flex items-center gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                  {m.label}:
                </span>
                <span className="text-sm font-medium" style={{ color: "#1e293b" }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px" style={{ background: "#e2e8f0" }} />

        {/* Problem Context */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Problem Context & Objective</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardLabel color="oklch(62.8% 0.218 38.4)">Challenge</CardLabel>
              <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
                {project.clientName} requires a scalable technology solution for Digital Product Passports (DPP) and
                Life Cycle Assessment (LCA) aligned with EU sustainability regulations (ESPR, CSRD, EUDR).
                The objective is to identify and evaluate the most mature startups capable of delivering
                enterprise-grade traceability and environmental impact measurement for complex textile supply chains.
              </p>
            </Card>
            <Card>
              <CardLabel color="oklch(62.8% 0.218 38.4)">Scope</CardLabel>
              <div className="space-y-1.5 text-sm" style={{ color: "#334155" }}>
                {project.geoAllowed && (
                  <div><span className="font-semibold">Geography Allowed:</span> {project.geoAllowed}</div>
                )}
                {project.geoExcluded && (
                  <div><span className="font-semibold">Geography Excluded:</span> {project.geoExcluded}</div>
                )}
                <div><span className="font-semibold">Universe Evaluated:</span> {startups.length} startups</div>
                <div><span className="font-semibold">Eligible for Scoring:</span> {eligible.length} startups</div>
                {excluded.length > 0 && (
                  <div><span className="font-semibold">Excluded:</span> {excluded.length} startups</div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Evaluation Criteria */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Evaluation Criteria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mustHaves.length > 0 && (
              <Card>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block"
                  style={{ background: "#dcfce7", color: "#166534" }}>Must Have</span>
                <div className="space-y-2 mt-3">
                  {mustHaves.map(r => (
                    <div key={r.name} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#1e293b" }}>{r.name}</div>
                        {r.description && <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{r.description}</div>}
                      </div>
                      <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: "#dcfce7", color: "#166534" }}>{r.weight}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {shouldHaves.length > 0 && (
              <Card>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block"
                  style={{ background: "#fef3c7", color: "#92400e" }}>Should Have</span>
                <div className="space-y-2 mt-3">
                  {shouldHaves.map(r => (
                    <div key={r.name} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#1e293b" }}>{r.name}</div>
                        {r.description && <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{r.description}</div>}
                      </div>
                      <span className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: "#fef3c7", color: "#92400e" }}>{r.weight}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>

        {/* Methodology */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Methodology</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "WSM (50%)",          color: "oklch(62.8% 0.218 38.4)", desc: "Weighted Sum Model — scores each startup against all requirements using analyst + AI scores." },
              { label: "Pugh Matrix (30%)",  color: "#3b82f6",                 desc: "Comparative evaluation against a reference standard. Identifies relative strengths and weaknesses." },
              { label: "Capability Fit (20%)", color: "#22c55e",               desc: "Assessment of 8 key technical capabilities required for enterprise deployment." },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-5 space-y-2 bg-white border"
                style={{ borderColor: "#e2e8f0", borderTop: `3px solid ${m.color}` }}>
                <div className="font-bold text-sm" style={{ color: "#0f172a" }}>{m.label}</div>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 text-sm" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <span className="font-semibold" style={{ color: "#c2410c" }}>Composite Score Formula: </span>
            <span style={{ color: "#1e293b" }}>WSM × 0.50 + Pugh Normalized × 0.30 + Capability Fit Avg × 0.20</span>
          </div>
        </section>

        {/* CTA */}
        <div className="flex justify-center pt-4">
          <Button onClick={onNext} size="lg" className="px-8 font-semibold"
            style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
            View Final Analysis & Rankings
            <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </main>

      <footer className="border-t mt-16 py-6 bg-white" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-6 w-auto opacity-40" />
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            © VCL Studio · Innovation Scouting · Strictly Confidential
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── Page 2: Rankings Table ───────────────────────────────────────────────
function RankingsPage({ data, onBack }: { data: ReportData; onBack: () => void }) {
  const { project, startups, rankings, recommendations } = data;
  const startupMap = new Map(startups.map(s => [s.id, s]));
  const recMap     = new Map(recommendations.map(r => [r.startupId, r]));

  const rows = [...rankings]
    .filter(r => r.rank != null)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .map(r => ({ ...r, startup: startupMap.get(r.startupId), rec: recMap.get(r.startupId) }))
    .filter(r => r.startup);

  const fmt = (v: number | null | undefined) => v != null ? v.toFixed(2) : "—";

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f5" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b shadow-sm bg-white" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} style={{ color: "#64748b" }}>
              <ChevronLeft size={15} className="mr-1" /> Context
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <img src={LOGO_DARK} alt="VCL Studio" className="h-7 w-auto" />
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: "#fff7ed", color: "#c2410c" }}>Confidential</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Section header */}
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "oklch(62.8% 0.218 38.4)" }}>Section C</div>
          <h1 className="text-2xl font-black" style={{ color: "#0f172a" }}>
            Final Ranking & Strategic Technology Selection
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            {project.clientName} · {project.reportDate} · Hover a company name for details
          </p>
        </div>

        {/* Tier legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TIER).map(([t, cfg]) => (
            <span key={t} className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden shadow border" style={{ borderColor: "#e2e8f0" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: "#1e293b" }}>
                  {[
                    { h: "Rank",             cls: "w-12 text-center" },
                    { h: "Company",          cls: "w-40 text-left" },
                    { h: "Composite Score",  cls: "w-24 text-center" },
                    { h: "WSM (Raw)",        cls: "w-20 text-center" },
                    { h: "Pugh (Norm.)",     cls: "w-24 text-center" },
                    { h: "Cap Fit (Avg)",    cls: "w-24 text-center" },
                    { h: "Tier",             cls: "w-40 text-center" },
                    { h: "Strategic Fit",    cls: "text-left min-w-[180px]" },
                    { h: "Key Differentiator", cls: "text-left min-w-[200px]" },
                  ].map(c => (
                    <th key={c.h} className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider ${c.cls}`}
                      style={{ color: "#94a3b8", borderBottom: "2px solid #334155" }}>
                      {c.h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const tier    = row.tier ?? 4;
                  const tierCfg = TIER[tier] ?? TIER[4];
                  const isRec   = row.rec?.decision === "recommended";
                  return (
                    <tr key={row.startupId}
                      style={{
                        background: idx % 2 === 0 ? "white" : "#f8fafc",
                        borderBottom: "1px solid #f1f5f9",
                      }}>
                      {/* Rank */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="font-black text-lg" style={{ color: "oklch(62.8% 0.218 38.4)" }}>
                          {row.rank}
                        </span>
                      </td>
                      {/* Company */}
                      <td className="px-3 py-3.5">
                        {row.startup
                          ? <HoverCard startup={row.startup}>{row.startup.name}</HoverCard>
                          : "—"}
                        {!isRec && (
                          <div className="text-xs mt-0.5" style={{ color: "#ef4444" }}>Not recommended</div>
                        )}
                      </td>
                      {/* Composite */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="font-black text-base" style={{ color: "#0f172a" }}>
                          {fmt(row.compositeScore)}
                        </span>
                      </td>
                      {/* WSM */}
                      <td className="px-3 py-3.5 text-center font-medium" style={{ color: "#334155" }}>
                        {fmt(row.wsmScore)}
                      </td>
                      {/* Pugh */}
                      <td className="px-3 py-3.5 text-center font-medium" style={{ color: "#334155" }}>
                        {fmt(row.pughNormalized)}
                      </td>
                      {/* CapFit */}
                      <td className="px-3 py-3.5 text-center font-medium" style={{ color: "#334155" }}>
                        {fmt(row.capfitAvg)}
                      </td>
                      {/* Tier badge */}
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ background: tierCfg.bg, color: tierCfg.text }}>
                          {tierCfg.label}
                        </span>
                      </td>
                      {/* Strategic Fit */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                          {row.startup?.strategicFit ?? "—"}
                        </span>
                      </td>
                      {/* Key Differentiator */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs leading-relaxed" style={{ color: "#475569" }}>
                          {row.startup?.keyDifferentiator ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendations */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "#0f172a" }}>Analyst Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.filter(r => r.rec?.narrative || r.rec?.aiDraft).map(row => {
              const tier    = row.tier ?? 4;
              const tierCfg = TIER[tier] ?? TIER[4];
              const isRec   = row.rec?.decision === "recommended";
              const text    = row.rec?.narrative ?? row.rec?.aiDraft;
              return (
                <div key={row.startupId} className="rounded-xl p-5 space-y-2 bg-white border"
                  style={{ borderColor: "#e2e8f0", borderLeft: `4px solid ${tierCfg.border}` }}>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: "#0f172a" }}>
                      #{row.rank} {row.startup?.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: tierCfg.bg, color: tierCfg.text }}>{tierCfg.label}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: isRec ? "#dcfce7" : "#fee2e2",
                          color:      isRec ? "#166534" : "#991b1b",
                        }}>
                        {isRec ? "✓ Recommended" : "✗ Not Recommended"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>{text}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t mt-16 py-6 bg-white" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-6 w-auto opacity-40" />
          <span className="text-xs" style={{ color: "#94a3b8" }}>
            © VCL Studio · Innovation Scouting · Strictly Confidential
          </span>
        </div>
      </footer>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-2 bg-white border" style={{ borderColor: "#e2e8f0" }}>
      {children}
    </div>
  );
}
function CardLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{children}</div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const params    = useParams<{ projectId: string }>();
  const projectId = parseInt(params.projectId ?? "0", 10);
  const [passkey, setPasskey] = useState<string | null>(null);
  const [page,    setPage]    = useState<"context" | "rankings">("context");

  const { data, isLoading, error } = trpc.report.getByPasskey.useQuery(
    { projectId, passkey: passkey ?? "" },
    { enabled: !!passkey && !isNaN(projectId), retry: false }
  );

  if (isNaN(projectId) || projectId === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f5" }}>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold" style={{ color: "#1e293b" }}>Invalid report link.</p>
          <p className="text-sm" style={{ color: "#64748b" }}>Please contact your VCL Studio analyst.</p>
        </div>
      </div>
    );
  }

  if (!passkey) return <PasskeyGate projectId={projectId} onUnlock={setPasskey} />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f5" }}>
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin mx-auto" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={36} />
          <p className="text-sm" style={{ color: "#64748b" }}>Loading report…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f5" }}>
        <div className="text-center space-y-3">
          <Lock size={32} className="mx-auto" style={{ color: "#94a3b8" }} />
          <p className="text-lg font-semibold" style={{ color: "#1e293b" }}>Report unavailable.</p>
          <p className="text-sm" style={{ color: "#64748b" }}>
            {error?.message?.includes("NOT_FOUND")
              ? "This report is not published."
              : "Please check your passkey and try again."}
          </p>
          <Button variant="outline" size="sm" onClick={() => setPasskey(null)}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (page === "context") return <ContextPage data={data as ReportData} onNext={() => setPage("rankings")} />;
  return <RankingsPage data={data as ReportData} onBack={() => setPage("context")} />;
}
