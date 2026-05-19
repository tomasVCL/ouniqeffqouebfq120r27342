import { trpc } from "@/lib/trpc";
import { Loader2, Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export default function StepJ({ projectId }: { projectId: number }) {
  const { data: rankings, isLoading } = trpc.rankings.get.useQuery({ projectId });
  const { data: startups } = trpc.startups.list.useQuery({ projectId });

  const enriched = (rankings ?? []).map((r) => ({
    ...r,
    startup: startups?.find(s => s.id === r.startupId),
  })).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  const tiers = [1, 2, 3, 4];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step J · Rankings & Tiers</h2>
        <p className="text-sm text-muted-foreground mt-1">Final ranked list derived from composite scores in Step I.</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !enriched.length ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No rankings yet. Complete Step I and click "Calculate & Save Rankings".</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiers.map(tier => {
              const count = enriched.filter(r => r.tier === tier).length;
              const label = tierLabelByNum(tier);
              const color = tierColorByNum(tier);
              return (
                <div key={tier} className="rounded-xl border p-3 text-center" style={{ borderColor: color + "44", background: color + "15" }}>
                  <div className="text-2xl font-black" style={{ color }}>{count}</div>
                  <div className="text-xs font-medium mt-1" style={{ color }}>{label.split(" – ")[0]}</div>
                  <div className="text-xs text-muted-foreground">{label.split(" – ")[1]}</div>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {enriched.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)", borderLeft: "4px solid " + tierColorByNum(r.tier) }}>
                <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 font-black text-lg" style={{ background: tierColorByNum(r.tier) + "22", color: tierColorByNum(r.tier) }}>
                  {idx === 0 ? <Trophy size={18} /> : "#" + r.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{r.startup?.name ?? "Startup #" + r.startupId}</span>
                    {r.startup?.hqCountry && <span className="text-xs text-muted-foreground">{r.startup.hqCountry}</span>}
                    {r.startup?.fundingStage && <Badge variant="secondary" className="text-xs">{r.startup.fundingStage}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>WSM: <strong style={{ color: "oklch(62.8% 0.218 38.4)" }}>{r.wsmScore?.toFixed(1)}</strong></span>
                    <span>Pugh: <strong style={{ color: "oklch(65.0% 0.180 250.0)" }}>{r.pughNormalized?.toFixed(1)}</strong></span>
                    <span>CapFit: <strong style={{ color: "oklch(60.0% 0.140 145.0)" }}>{r.capfitAvg?.toFixed(1)}</strong></span>
                  </div>
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
      )}
    </div>
  );
}
