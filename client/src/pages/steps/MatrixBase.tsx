import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type MatrixType = "wsm" | "pugh" | "capfit";

interface ScoreCell {
  startupId: number;
  requirementId: number;
  humanScore: number | null;
  aiScore: number | null;
  justification: string | null;
}

interface MatrixProps {
  projectId: number;
  matrixType: MatrixType;
  title: string;
  description: string;
  scoreOptions: { value: number; label: string; color: string }[];
  getScoreLabel: (v: number | null) => string;
  getScoreColor: (v: number | null) => string;
}

export function EvaluationMatrix({ projectId, matrixType, title, description, scoreOptions, getScoreLabel, getScoreColor }: MatrixProps) {
  const utils = trpc.useUtils();
  const [showAI, setShowAI] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: startups } = trpc.startups.list.useQuery({ projectId });
  const { data: requirements } = trpc.requirements.list.useQuery({ projectId });
  const { data: allScores, isLoading } = trpc.scores.getAll.useQuery({ projectId });
  const scores = allScores?.[matrixType] ?? [];

  const eligible = startups?.filter(s => s.eligible) ?? [];

  const upsertWsm = trpc.scores.upsertWsm.useMutation({
    onSuccess: () => utils.scores.getAll.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const upsertPugh = trpc.scores.upsertPugh.useMutation({
    onSuccess: () => utils.scores.getAll.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const upsertCapfit = trpc.scores.upsertCapfit.useMutation({
    onSuccess: () => utils.scores.getAll.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const generateAI = trpc.scores.aiSuggest.useMutation({
    onMutate: () => setGenerating(true),
    onSuccess: () => { utils.scores.getAll.invalidate({ projectId }); setGenerating(false); toast.success("AI scores generated"); },
    onError: (e: { message: string }) => { setGenerating(false); toast.error(e.message); },
  });

  const getScore = useCallback((startupId: number, colId: number): ScoreCell | undefined => {
    if (matrixType === "capfit") {
      return (scores as Array<{startupId: number; capabilityId: number; humanScore: string | null; aiScore: string | null; justificationNote: string | null}>)?.find(s => s.startupId === startupId && s.capabilityId === colId) as unknown as ScoreCell | undefined;
    }
    return (scores as Array<{startupId: number; requirementId: number; humanScore: number | null; aiScore: number | null; justificationNote: string | null}>)?.find(s => s.startupId === startupId && s.requirementId === colId) as unknown as ScoreCell | undefined;
  }, [scores, matrixType]);

  const setHumanScore = (startupId: number, colId: number, score: number) => {
    if (matrixType === "wsm") upsertWsm.mutate({ projectId, startupId, requirementId: colId, humanScore: score });
    else if (matrixType === "pugh") upsertPugh.mutate({ projectId, startupId, requirementId: colId, humanScore: score });
    else if (matrixType === "capfit") upsertCapfit.mutate({ projectId, startupId, capabilityId: colId, humanScore: score === 2 ? "High" : score === 1 ? "Med" : "Low" });
  };

  if (!requirements?.length || !eligible.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div>
          <h2 className="text-xl font-display font-black">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="rounded-xl border p-8 text-center text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm">Complete Steps B (Requirements) and D (Startup Universe) first to populate this matrix.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-black">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch checked={showAI} onCheckedChange={setShowAI} id="show-ai" />
            <Label htmlFor="show-ai" className="text-sm flex items-center gap-1 cursor-pointer">
              {showAI ? <Eye size={14} /> : <EyeOff size={14} />}
              AI Comparison
            </Label>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateAI.mutate({ projectId, matrixType })}
            disabled={generating}
          >
            {generating ? <Loader2 className="animate-spin mr-2" size={14} /> : <Sparkles size={14} className="mr-2" />}
            Generate AI Scores
          </Button>
        </div>
      </div>

      {/* Score legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {scoreOptions.map(opt => (
          <span key={opt.value} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: opt.color + "22", color: opt.color, border: `1px solid ${opt.color}44` }}>
            {opt.value === 0 ? "0" : opt.value > 0 ? `+${opt.value}` : opt.value} = {opt.label}
          </span>
        ))}
      </div>

      {/* Matrix table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "var(--muted)" }}>
                <th className="text-left px-3 py-2 font-semibold text-xs sticky left-0 z-10 min-w-[140px]" style={{ background: "var(--muted)" }}>
                  Startup
                </th>
                {requirements.map(req => (
                  <th key={req.id} className="px-2 py-2 text-center font-medium text-xs min-w-[90px]">
                    <div className="truncate max-w-[80px] mx-auto" title={req.name}>{req.name}</div>
                    <div className="text-muted-foreground font-normal">w={req.weight}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-semibold text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((startup, rowIdx) => {
                let humanTotal = 0;
                let aiTotal = 0;
                return (
                  <tr key={startup.id} style={{ background: rowIdx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                    <td className="px-3 py-2 font-medium text-xs sticky left-0 z-10" style={{ background: rowIdx % 2 === 0 ? "var(--card)" : "var(--muted)" }}>
                      {startup.name}
                    </td>
                    {requirements.map(req => {
                      const cell = getScore(startup.id, req.id);
                      const hScore = cell?.humanScore ?? null;
                      const aScore = cell?.aiScore ?? null;
                      if (hScore !== null) humanTotal += hScore * req.weight;
                      if (aScore !== null) aiTotal += aScore * req.weight;
                      return (
                        <td key={req.id} className="px-1 py-1 text-center">
                          <div className="flex flex-col gap-0.5 items-center">
                            {/* Human score selector */}
                            <select
                              className="w-16 h-7 rounded text-xs text-center border font-medium"
                              style={{ background: hScore !== null ? getScoreColor(hScore) + "22" : "var(--background)", borderColor: hScore !== null ? getScoreColor(hScore) + "66" : "var(--border)", color: hScore !== null ? getScoreColor(hScore) : "var(--muted-foreground)" }}
                              value={hScore ?? ""}
                              onChange={e => e.target.value !== "" && setHumanScore(startup.id, req.id, parseFloat(e.target.value))}
                            >
                              <option value="">-</option>
                              {scoreOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.value > 0 ? `+${opt.value}` : opt.value}</option>)}
                            </select>
                            {/* AI score (shown when toggle is on) */}
                            {showAI && (
                              <div className="text-xs px-1 py-0.5 rounded w-16 text-center" style={{ background: aScore !== null ? getScoreColor(aScore) + "15" : "transparent", color: aScore !== null ? getScoreColor(aScore) : "var(--muted-foreground)", border: `1px dashed ${aScore !== null ? getScoreColor(aScore) + "44" : "var(--border)"}` }}>
                                AI: {aScore !== null ? (aScore > 0 ? `+${aScore}` : aScore) : "-"}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <div className="font-bold text-sm" style={{ color: "oklch(62.8% 0.218 38.4)" }}>{humanTotal.toFixed(1)}</div>
                      {showAI && <div className="text-xs text-muted-foreground">AI: {aiTotal.toFixed(1)}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
