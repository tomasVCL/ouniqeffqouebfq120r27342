import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Edit3, Check, X } from "lucide-react";

export default function StepK({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: recommendations, isLoading } = trpc.recommendations.list.useQuery({ projectId });
  const { data: startups } = trpc.startups.list.useQuery({ projectId });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const generate = trpc.recommendations.generateAiDrafts.useMutation({
    onSuccess: () => { utils.recommendations.list.invalidate({ projectId }); toast.success("AI drafts generated"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const update = trpc.recommendations.update.useMutation({
    onSuccess: () => { utils.recommendations.list.invalidate({ projectId }); setEditingId(null); toast.success("Saved"); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const startEdit = (rec: { id: number; narrative: string | null; aiDraft: string | null }) => {
    setEditingId(rec.id);
    setEditText(rec.narrative ?? rec.aiDraft ?? "");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-black">Step K · AI Recommendations</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate AI-drafted recommendations for each top-tier startup, then edit inline before publishing.</p>
        </div>
        <Button onClick={() => generate.mutate({ projectId })} disabled={generate.isPending} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          {generate.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Sparkles size={14} className="mr-2" />}
          Generate AI Drafts
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !recommendations?.length ? (
        <div className="rounded-xl border p-8 text-center text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No recommendations yet. Click "Generate AI Drafts" to create recommendations based on rankings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(rec => {
            const startup = startups?.find(s => s.id === rec.startupId);
            return (
              <div key={rec.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{startup?.name ?? `Startup #${rec.startupId}`}</span>
                    {rec.decision && (
                      <Badge className="text-xs" style={{
                        background: rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0 / 0.15)" : "oklch(55.0% 0.200 25.0 / 0.15)",
                        color: rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0)" : "oklch(55.0% 0.200 25.0)",
                        border: `1px solid ${rec.decision === "recommended" ? "oklch(60.0% 0.140 145.0 / 0.3)" : "oklch(55.0% 0.200 25.0 / 0.3)"}`
                      }}>
                        {rec.decision === "recommended" ? "Recommended" : "Not Recommended"}
                      </Badge>
                    )}
                    {rec.decisionReason && <Badge variant="secondary" className="text-xs">{rec.decisionReason.replace("_", " ")}</Badge>}
                  </div>
                  {editingId !== rec.id && (
                    <button onClick={() => startEdit(rec)} className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0">
                      <Edit3 size={14} />
                    </button>
                  )}
                </div>
                {editingId === rec.id ? (
                  <div className="space-y-2">
                    <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={6} className="text-sm" placeholder="Write your recommendation..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => update.mutate({ projectId, startupId: rec.startupId, narrative: editText })} disabled={update.isPending} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
                        {update.isPending ? <Loader2 className="animate-spin mr-1" size={12} /> : <Check size={12} className="mr-1" />}Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        <X size={12} className="mr-1" />Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rec.narrative ? (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Analyst Version</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{rec.narrative}</p>
                      </div>
                    ) : rec.aiDraft ? (
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "oklch(65.0% 0.180 250.0)" }}><Sparkles size={10} />AI Draft</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground italic">{rec.aiDraft}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No recommendation text yet. Click edit to write one.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
