import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Building2, ExternalLink } from "lucide-react";

interface Props { projectId: number; }

export default function StepD({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: startups, isLoading } = trpc.startups.list.useQuery({ projectId });
  const [form, setForm] = useState({ name: "", hqCountry: "", fundingStage: "Seed" as "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series B+", tagline: "", eligible: true });
  const [showForm, setShowForm] = useState(false);

  const add = trpc.startups.upsert.useMutation({
    onSuccess: () => { utils.startups.list.invalidate({ projectId }); setForm({ name: "", hqCountry: "", fundingStage: "Seed" as "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series B+", tagline: "", eligible: true }); setShowForm(false); },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const remove = trpc.startups.delete.useMutation({
    onSuccess: () => utils.startups.list.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const toggleEligible = trpc.startups.upsert.useMutation({
    onSuccess: () => utils.startups.list.invalidate({ projectId }),
  });

  const STAGES = ["Pre-seed","Seed","Series A","Series B","Series B+"] as const;
  const eligible = startups?.filter(s => s.eligible) ?? [];
  const ineligible = startups?.filter(s => !s.eligible) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-black">Step D · Startup Universe</h2>
          <p className="text-sm text-muted-foreground mt-1">Add all startups to evaluate. Mark eligibility based on initial screening.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          <Plus size={14} className="mr-2" />Add Startup
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "oklch(62.8% 0.218 38.4 / 0.3)", background: "var(--card)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Startup Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Stripe" />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input value={form.hqCountry} onChange={e => setForm(f => ({ ...f, hqCountry: e.target.value }))} placeholder="e.g. United States" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Stage</Label>
              <select className="w-full h-9 rounded-md border px-3 text-sm" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }} value={form.fundingStage} onChange={e => setForm(f => ({ ...f, fundingStage: e.target.value as "Pre-seed" | "Seed" | "Series A" | "Series B" | "Series B+" }))}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Brief description of what the startup does..." rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.eligible} onCheckedChange={v => setForm(f => ({ ...f, eligible: v }))} />
            <Label>Eligible for evaluation</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => form.name && add.mutate({ projectId, name: form.name, hqCountry: form.hqCountry || undefined, fundingStage: form.fundingStage, tagline: form.tagline || undefined, eligible: form.eligible })} disabled={!form.name || add.isPending} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
              {add.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-2" />}Add
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !startups?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No startups yet. Add your first startup above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eligible.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Eligible ({eligible.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eligible.map(s => (
                  <StartupCard key={s.id} startup={s} onDelete={() => remove.mutate({ id: s.id })} onToggle={() => toggleEligible.mutate({ id: s.id, projectId, name: s.name, eligible: false })} />
                ))}
              </div>
            </div>
          )}
          {ineligible.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                Ineligible ({ineligible.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                {ineligible.map(s => (
                  <StartupCard key={s.id} startup={s} onDelete={() => remove.mutate({ id: s.id })} onToggle={() => toggleEligible.mutate({ id: s.id, projectId, name: s.name, eligible: true })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StartupCard({ startup, onDelete, onToggle }: { startup: any; onDelete: () => void; onToggle: () => void }) {
  return (
    <div className="rounded-xl border p-3 flex items-start gap-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: "oklch(62.8% 0.218 38.4)" }}>
        {startup.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{startup.name}</span>
          <Badge variant="secondary" className="text-xs">{startup.fundingStage}</Badge>
          {startup.hqCountry && <span className="text-xs text-muted-foreground">{startup.hqCountry}</span>}
        </div>
        {startup.tagline && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{startup.tagline}</p>}
        <div className="flex items-center gap-2 mt-2">
          {startup.website && <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: "oklch(62.8% 0.218 38.4)" }} onClick={e => e.stopPropagation()}><ExternalLink size={10} />Website</a>}
          <button onClick={onToggle} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {startup.eligible ? "Mark ineligible" : "Mark eligible"}
          </button>
        </div>
      </div>
      <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
