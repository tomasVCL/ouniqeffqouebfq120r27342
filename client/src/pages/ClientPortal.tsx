import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, CheckCircle, XCircle, Trophy, FileText, BarChart3 } from "lucide-react";

function tierColorByNum(tier: number | null): string {
  if (tier === 1) return "oklch(60.0% 0.140 145.0)";
  if (tier === 2) return "oklch(78.5% 0.175 75.0)";
  if (tier === 3) return "oklch(62.8% 0.218 38.4)";
  return "oklch(55.0% 0.200 25.0)";
}
function tierLabelByNum(tier: number | null): string {
  if (tier === 1) return "Tier 1 – Strong Fit";
  if (tier === 2) return "Tier 2 – Potential Fit";
  if (tier === 3) return "Tier 3 – Weak Fit";
  return "Tier 4 – No Fit";
}

export default function ClientPortal() {
  const params = useParams<{ projectId: string }>();
  const projectId = parseInt(params.projectId ?? "0");
  const [passkey, setPasskey] = useState("");
  const [submittedPasskey, setSubmittedPasskey] = useState<string | null>(null);

  const { data: report, isLoading, error } = trpc.report.getByPasskey.useQuery(
    { projectId, passkey: submittedPasskey ?? "" },
    { enabled: !!submittedPasskey, retry: false }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim()) setSubmittedPasskey(passkey.trim());
  };

  if (!submittedPasskey || (error && !report)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "oklch(62.8% 0.218 38.4 / 0.15)" }}>
              <Lock size={24} style={{ color: "oklch(62.8% 0.218 38.4)" }} />
            </div>
            <h1 className="text-2xl font-display font-black">Client Report</h1>
            <p className="text-sm text-muted-foreground">Enter the passkey provided by your analyst to access this report.</p>
            {error && (
              <p className="text-sm font-medium" style={{ color: "oklch(55.0% 0.200 25.0)" }}>
                Invalid passkey or report not found. Please try again.
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Passkey</Label>
              <Input
                type="password"
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                placeholder="Enter your passkey"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
              Access Report
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={32} />
      </div>
    );
  }

  if (!report) return null;

  const { project, startups, rankings, recommendations } = report;
  const eligible = startups.filter(s => s.eligible);
  const enrichedRankings = (rankings as Array<{ id: number; startupId: number; rank: number; compositeScore: number | null; tier: number | null }>)
    .map(r => ({ ...r, startup: startups.find(s => s.id === r.startupId) }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-black">{project.title}</h1>
            <p className="text-sm text-muted-foreground">{project.clientName} · {project.industry ?? "Innovation Scouting"}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {project.analystName && <p>{project.analystName}</p>}
            {project.reportDate && <p>{project.reportDate}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(tier => {
            const count = enrichedRankings.filter(r => r.tier === tier).length;
            const color = tierColorByNum(tier);
            const label = tierLabelByNum(tier);
            return (
              <div key={tier} className="rounded-xl border p-3 text-center" style={{ borderColor: color + "44", background: color + "15" }}>
                <div className="text-2xl font-black" style={{ color }}>{count}</div>
                <div className="text-xs font-medium mt-1" style={{ color }}>{label.split(" – ")[0]}</div>
                <div className="text-xs text-muted-foreground">{label.split(" – ")[1]}</div>
              </div>
            );
          })}
        </div>

        {/* Rankings */}
        <div>
          <h2 className="text-lg font-display font-black mb-4 flex items-center gap-2">
            <BarChart3 size={18} style={{ color: "oklch(62.8% 0.218 38.4)" }} />
            Startup Rankings
          </h2>
          <div className="space-y-2">
            {enrichedRankings.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)", borderLeft: "4px solid " + tierColorByNum(r.tier) }}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 font-black text-lg" style={{ background: tierColorByNum(r.tier) + "22", color: tierColorByNum(r.tier) }}>
                  {idx === 0 ? <Trophy size={18} /> : "#" + r.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{r.startup?.name ?? `Startup #${r.startupId}`}</span>
                    {r.startup?.hqCountry && <span className="text-xs text-muted-foreground">{r.startup.hqCountry}</span>}
                    {r.startup?.fundingStage && <Badge variant="secondary" className="text-xs">{r.startup.fundingStage}</Badge>}
                  </div>
                  {r.startup?.tagline && <p className="text-xs text-muted-foreground mt-0.5">{r.startup.tagline}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black" style={{ color: tierColorByNum(r.tier) }}>{r.compositeScore?.toFixed(1)}</div>
                  <Badge className="text-xs" style={{ background: tierColorByNum(r.tier) + "22", color: tierColorByNum(r.tier), border: "1px solid " + tierColorByNum(r.tier) + "44" }}>
                    {tierLabelByNum(r.tier).split(" – ")[0]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {(recommendations as Array<{ id: number; startupId: number; narrative: string | null; aiDraft: string | null; decision: string | null }>).length > 0 && (
          <div>
            <h2 className="text-lg font-display font-black mb-4 flex items-center gap-2">
              <FileText size={18} style={{ color: "oklch(62.8% 0.218 38.4)" }} />
              Analyst Recommendations
            </h2>
            <div className="space-y-4">
              {(recommendations as Array<{ id: number; startupId: number; narrative: string | null; aiDraft: string | null; decision: string | null }>).map(rec => {
                const startup = startups.find(s => s.id === rec.startupId);
                const text = rec.narrative ?? rec.aiDraft;
                if (!text) return null;
                return (
                  <div key={rec.id} className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{startup?.name ?? `Startup #${rec.startupId}`}</span>
                      {rec.decision && (
                        <Badge className="text-xs flex items-center gap-1" style={{
                          background: rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0 / 0.15)" : "oklch(55.0% 0.200 25.0 / 0.15)",
                          color: rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0)" : "oklch(55.0% 0.200 25.0)",
                          border: `1px solid ${rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0 / 0.3)" : "oklch(55.0% 0.200 25.0 / 0.3)"}`
                        }}>
                          {rec.decision === "recommended" ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {rec.decision === "recommended" ? "Recommended" : "Not Recommended"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Universe */}
        <div>
          <h2 className="text-lg font-display font-black mb-4">Evaluated Universe ({eligible.length} startups)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eligible.map(s => (
              <div key={s.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    {s.tagline && <p className="text-xs text-muted-foreground mt-0.5">{s.tagline}</p>}
                  </div>
                  {s.fundingStage && <Badge variant="secondary" className="text-xs shrink-0">{s.fundingStage}</Badge>}
                </div>
                {s.hqCountry && <p className="text-xs text-muted-foreground mt-1">{s.hqCity ? `${s.hqCity}, ` : ""}{s.hqCountry}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground py-4 border-t" style={{ borderColor: "var(--border)" }}>
          Confidential report prepared by {project.analystName ?? "VCL Studio"} for {project.clientName}
          {project.analystEmail && ` · ${project.analystEmail}`}
        </div>
      </div>
    </div>
  );
}
