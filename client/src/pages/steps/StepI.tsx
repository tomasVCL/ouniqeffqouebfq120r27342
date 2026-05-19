import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Props { projectId: number; }

const WEIGHTS = { wsm: 0.5, pugh: 0.3, capfit: 0.2 };

function tierColor(score: number): string {
  if (score >= 75) return "oklch(60.0% 0.140 145.0)";
  if (score >= 50) return "oklch(78.5% 0.175 75.0)";
  if (score >= 25) return "oklch(62.8% 0.218 38.4)";
  return "oklch(55.0% 0.200 25.0)";
}

function tierLabel(score: number): string {
  if (score >= 75) return "Tier 1 – Strong Fit";
  if (score >= 50) return "Tier 2 – Potential Fit";
  if (score >= 25) return "Tier 3 – Weak Fit";
  return "Tier 4 – No Fit";
}

export default function StepI({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: startups } = trpc.startups.list.useQuery({ projectId });
  const { data: requirements } = trpc.requirements.list.useQuery({ projectId });
  const { data: capabilities } = trpc.capabilities.list.useQuery({ projectId });
  const { data: allScores, isLoading } = trpc.scores.getAll.useQuery({ projectId });

  const calculateRankings = trpc.rankings.calculate.useMutation({
    onSuccess: () => { utils.rankings.get.invalidate({ projectId }); toast.success("Rankings calculated and saved"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const eligible = startups?.filter(s => s.eligible) ?? [];
  const reqs = requirements ?? [];
  const caps = capabilities ?? [];
  const wsmScores = allScores?.wsm ?? [];
  const pughScores = allScores?.pugh ?? [];
  const capfitScores = allScores?.capfit ?? [];

  const capfitToNum = (v: string | null): number => v === "High" ? 1 : v === "Med" ? 0.5 : 0;

  const composites = eligible.map(startup => {
    const totalWeight = reqs.reduce((s, r) => s + r.weight, 0) || 1;
    const wsmRaw = reqs.reduce((sum, req) => {
      const cell = wsmScores.find((s: { startupId: number; requirementId: number; humanScore: number | null }) => s.startupId === startup.id && s.requirementId === req.id);
      return sum + (cell?.humanScore ?? 0) * req.weight;
    }, 0);
    const wsmNorm = (wsmRaw / (10 * totalWeight)) * 100;

    const pughRaw = reqs.reduce((sum, req) => {
      const cell = pughScores.find((s: { startupId: number; requirementId: number; humanScore: number | null }) => s.startupId === startup.id && s.requirementId === req.id);
      return sum + (cell?.humanScore ?? 0) * req.weight;
    }, 0);
    const pughNorm = ((pughRaw / totalWeight) + 1) / 2 * 100;

    let capfitSum = 0;
    let capfitCount = 0;
    for (const cap of caps) {
      const cell = capfitScores.find((s: { startupId: number; capabilityId: number; humanScore: string | null }) => s.startupId === startup.id && s.capabilityId === cap.id);
      if (cell) { capfitSum += capfitToNum(cell.humanScore); capfitCount++; }
    }
    const capfitNorm = capfitCount > 0 ? (capfitSum / capfitCount) * 100 : 0;

    const composite = wsmNorm * WEIGHTS.wsm + pughNorm * WEIGHTS.pugh + capfitNorm * WEIGHTS.capfit;
    return {
      startup,
      wsmNorm: Math.round(wsmNorm * 10) / 10,
      pughNorm: Math.round(pughNorm * 10) / 10,
      capfitNorm: Math.round(capfitNorm * 10) / 10,
      composite: Math.round(composite * 10) / 10,
    };
  }).sort((a, b) => b.composite - a.composite);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-black">Step I · Composite Evaluation Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-calculated composite score: WSM×50% + Pugh×30% + CapFit×20%. All scores normalized to 0–100.
          </p>
        </div>
        <Button onClick={() => calculateRankings.mutate({ projectId })} disabled={calculateRankings.isPending || !composites.length} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          {calculateRankings.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <RefreshCw size={14} className="mr-2" />}
          Calculate & Save Rankings
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="px-2 py-1 rounded-full font-medium" style={{ background: "oklch(62.8% 0.218 38.4 / 0.15)", color: "oklch(62.8% 0.218 38.4)" }}>WSM 50%</span>
        <span className="px-2 py-1 rounded-full font-medium" style={{ background: "oklch(65.0% 0.180 250.0 / 0.15)", color: "oklch(65.0% 0.180 250.0)" }}>Pugh 30%</span>
        <span className="px-2 py-1 rounded-full font-medium" style={{ background: "oklch(60.0% 0.140 145.0 / 0.15)", color: "oklch(60.0% 0.140 145.0)" }}>CapFit 20%</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !composites.length ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm">No eligible startups found. Complete Steps B, D, F, G, and H first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                <th className="text-left px-4 py-3 font-semibold text-xs">Rank</th>
                <th className="text-left px-4 py-3 font-semibold text-xs">Startup</th>
                <th className="px-4 py-3 text-center font-semibold text-xs" style={{ color: "oklch(62.8% 0.218 38.4)" }}>WSM (50%)</th>
                <th className="px-4 py-3 text-center font-semibold text-xs" style={{ color: "oklch(65.0% 0.180 250.0)" }}>Pugh (30%)</th>
                <th className="px-4 py-3 text-center font-semibold text-xs" style={{ color: "oklch(60.0% 0.140 145.0)" }}>CapFit (20%)</th>
                <th className="px-4 py-3 text-center font-bold text-xs">Composite</th>
                <th className="px-4 py-3 text-center font-semibold text-xs">Tier</th>
              </tr>
            </thead>
            <tbody>
              {composites.map((row, idx) => (
                <tr key={row.startup.id} style={{ background: idx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                  <td className="px-4 py-3 font-bold text-center text-sm" style={{ color: "oklch(62.8% 0.218 38.4)" }}>#{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-sm">
                    {row.startup.name}
                    {row.startup.hqCountry && <span className="text-xs text-muted-foreground ml-2">{row.startup.hqCountry}</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium" style={{ color: "oklch(62.8% 0.218 38.4)" }}>{row.wsmNorm}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium" style={{ color: "oklch(65.0% 0.180 250.0)" }}>{row.pughNorm}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium" style={{ color: "oklch(60.0% 0.140 145.0)" }}>{row.capfitNorm}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg font-black" style={{ color: tierColor(row.composite) }}>{row.composite}</span>
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div className="h-full rounded-full" style={{ width: `${row.composite}%`, background: tierColor(row.composite) }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className="text-xs font-medium" style={{ background: tierColor(row.composite) + "22", color: tierColor(row.composite), border: `1px solid ${tierColor(row.composite)}44` }}>
                      {tierLabel(row.composite).split(" – ")[0]}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-0.5">{tierLabel(row.composite).split(" – ")[1]}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
