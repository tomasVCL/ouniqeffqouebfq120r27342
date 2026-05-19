import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react";

interface Props { projectId: number; }

const FORMULA_TYPES = ["Revenue", "Cost Savings", "Risk Reduction", "Time Savings"] as const;
type FormulaType = typeof FORMULA_TYPES[number];

export default function StepC({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: formulas, isLoading } = trpc.formulas.list.useQuery({ projectId });
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "Revenue" as FormulaType,
    expression: "",
  });

  const add = trpc.formulas.upsert.useMutation({
    onSuccess: () => {
      utils.formulas.list.invalidate({ projectId });
      setForm({ name: "", description: "", type: "Revenue", expression: "" });
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const remove = trpc.formulas.delete.useMutation({
    onSuccess: () => utils.formulas.list.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step C · Formula Library</h2>
        <p className="text-sm text-muted-foreground mt-1">Document business case formulas, benchmarks, and analytical frameworks used in this engagement.</p>
      </div>
      <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <h3 className="font-semibold text-sm">Add Formula / Framework</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CAC Payback Period" />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <select
              className="w-full h-9 rounded-md border px-3 text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as FormulaType }))}
            >
              {FORMULA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Expression</Label>
          <Input value={form.expression} onChange={e => setForm(f => ({ ...f, expression: e.target.value }))} placeholder="e.g. CAC / Monthly Gross Margin" className="font-mono" />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Explain what this formula measures and how it will be applied..." rows={2} />
        </div>
        <Button
          onClick={() => form.name && form.expression && add.mutate({ projectId, name: form.name, type: form.type, expression: form.expression, description: form.description || undefined })}
          disabled={!form.name || !form.expression || add.isPending}
          style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
        >
          {add.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-2" />}
          Add Formula
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !formulas?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No formulas yet. Add frameworks and benchmarks above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formulas.map(f => (
            <div key={f.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{f.name}</span>
                    <Badge variant="secondary" className="text-xs">{f.type}</Badge>
                  </div>
                  {f.expression && <p className="text-xs font-mono px-2 py-1 rounded" style={{ background: "var(--muted)", color: "oklch(62.8% 0.218 38.4)" }}>{f.expression}</p>}
                  {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                </div>
                <button onClick={() => remove.mutate({ id: f.id })} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
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
