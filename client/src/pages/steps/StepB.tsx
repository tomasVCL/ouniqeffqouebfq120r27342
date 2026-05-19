import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";

interface Props { projectId: number; }

export default function StepB({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: reqs, isLoading } = trpc.requirements.list.useQuery({ projectId });
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(5);
  const [category, setCategory] = useState("Strategic");

  const add = trpc.requirements.upsert.useMutation({
    onSuccess: () => { utils.requirements.list.invalidate({ projectId }); setName(""); setWeight(5); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const remove = trpc.requirements.delete.useMutation({
    onSuccess: () => utils.requirements.list.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const updateWeight = trpc.requirements.upsert.useMutation({
    onSuccess: () => utils.requirements.list.invalidate({ projectId }),
  });

  const totalWeight = reqs?.reduce((s, r) => s + r.weight, 0) ?? 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step B · Requirements Builder</h2>
        <p className="text-sm text-muted-foreground mt-1">Define weighted evaluation criteria. Total weight should sum to 100.</p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <h3 className="font-semibold text-sm">Add Requirement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <Label>Criterion Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Technical Maturity" onKeyDown={e => e.key === "Enter" && name && add.mutate({ projectId, name, weight, category })} />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select className="w-full h-9 rounded-md border px-3 text-sm" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }} value={category} onChange={e => setCategory(e.target.value)}>
              {["Strategic","Technical","Financial","Market","Operational"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Weight: <span className="font-bold" style={{ color: "oklch(62.8% 0.218 38.4)" }}>{weight}</span></Label>
          <Slider min={1} max={30} step={1} value={[weight]} onValueChange={([v]) => setWeight(v)} className="w-full" />
        </div>
        <Button onClick={() => name && add.mutate({ projectId, name, weight, category })} disabled={!name || add.isPending} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          {add.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-2" />}
          Add Requirement
        </Button>
      </div>

      {/* Total weight indicator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(totalWeight, 100)}%`, background: totalWeight === 100 ? "oklch(62.0% 0.140 145.0)" : totalWeight > 100 ? "oklch(62.8% 0.218 38.4)" : "oklch(62.8% 0.218 38.4)" }} />
        </div>
        <span className="text-sm font-medium w-20 text-right">
          {totalWeight}/100 {totalWeight === 100 ? "✓" : totalWeight > 100 ? "(over)" : ""}
        </span>
      </div>

      {/* Requirements list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !reqs?.length ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No requirements yet. Add your first criterion above.</p>
      ) : (
        <div className="space-y-2">
          {reqs.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <GripVertical size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{r.name}</span>
                  <Badge variant="secondary" className="text-xs">{r.category}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold w-8 text-right" style={{ color: "oklch(62.8% 0.218 38.4)" }}>{r.weight}</span>
                <button onClick={() => remove.mutate({ id: r.id })} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
