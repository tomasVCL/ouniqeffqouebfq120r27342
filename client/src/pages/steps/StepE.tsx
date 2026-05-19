import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Layers } from "lucide-react";

interface Props { projectId: number; }

const CLUSTER_COLORS = [
  "oklch(62.8% 0.218 38.4)",
  "oklch(62.0% 0.140 145.0)",
  "oklch(65.0% 0.180 250.0)",
  "oklch(70.0% 0.160 300.0)",
  "oklch(78.5% 0.175 75.0)",
  "oklch(60.0% 0.150 200.0)",
];

export default function StepE({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: clusters, isLoading: loadingClusters } = trpc.clusters.list.useQuery({ projectId });
  const { data: startups } = trpc.startups.list.useQuery({ projectId });
  const [form, setForm] = useState({ name: "", differentiator: "" });

  const addCluster = trpc.clusters.upsert.useMutation({
    onSuccess: () => {
      utils.clusters.list.invalidate({ projectId });
      setForm({ name: "", differentiator: "" });
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const removeCluster = trpc.clusters.delete.useMutation({
    onSuccess: () => utils.clusters.list.invalidate({ projectId }),
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // Assign startup to cluster by updating startup.clusterId
  const assignStartup = trpc.startups.upsert.useMutation({
    onSuccess: () => utils.startups.list.invalidate({ projectId }),
  });

  const eligibleStartups = startups?.filter(s => s.eligible) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step E · Strategic Clusters</h2>
        <p className="text-sm text-muted-foreground mt-1">Group eligible startups into strategic themes or technology clusters.</p>
      </div>
      {/* Add cluster */}
      <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <h3 className="font-semibold text-sm">Add Cluster</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Cluster Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. AI-Powered Lending" />
          </div>
          <div className="space-y-1">
            <Label>Key Differentiator</Label>
            <Input value={form.differentiator} onChange={e => setForm(f => ({ ...f, differentiator: e.target.value }))} placeholder="What sets this cluster apart?" />
          </div>
        </div>
        <Button
          onClick={() => form.name && addCluster.mutate({ projectId, name: form.name, differentiator: form.differentiator || undefined })}
          disabled={!form.name || addCluster.isPending}
          style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
        >
          {addCluster.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Plus size={14} className="mr-2" />}
          Add Cluster
        </Button>
      </div>
      {loadingClusters ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
      ) : !clusters?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No clusters yet. Create your first strategic cluster above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cluster, idx) => {
            const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
            const assigned = eligibleStartups.filter(s => s.clusterId === cluster.id);
            const unassigned = eligibleStartups.filter(s => !s.clusterId);
            return (
              <div key={cluster.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)", borderLeft: `4px solid ${color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm">{cluster.name}</h4>
                    {cluster.differentiator && <p className="text-xs text-muted-foreground">{cluster.differentiator}</p>}
                  </div>
                  <button onClick={() => removeCluster.mutate({ id: cluster.id })} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
                {/* Assigned startups */}
                <div className="flex flex-wrap gap-1">
                  {assigned.map(s => (
                    <button
                      key={s.id}
                      onClick={() => assignStartup.mutate({ id: s.id, projectId, name: s.name, clusterId: null })}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-70"
                      style={{ background: color }}
                    >
                      {s.name} ×
                    </button>
                  ))}
                </div>
                {/* Add startup dropdown */}
                {unassigned.length > 0 && (
                  <select
                    className="w-full h-8 rounded-md border px-2 text-xs"
                    style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    value=""
                    onChange={e => e.target.value && assignStartup.mutate({ id: parseInt(e.target.value), projectId, name: eligibleStartups.find(s => s.id === parseInt(e.target.value))?.name ?? "", clusterId: cluster.id })}
                  >
                    <option value="">+ Add startup to cluster</option>
                    {unassigned.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Unassigned startups */}
      {eligibleStartups.filter(s => !s.clusterId).length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Unassigned Startups</h3>
          <div className="flex flex-wrap gap-2">
            {eligibleStartups.filter(s => !s.clusterId).map(s => (
              <span key={s.id} className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: "var(--border)" }}>{s.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
