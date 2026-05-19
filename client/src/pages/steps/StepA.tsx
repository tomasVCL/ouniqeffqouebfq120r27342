import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

interface Props { projectId: number; }

export default function StepA({ projectId }: Props) {
  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: "", clientName: "", industry: "",
    geoAllowed: "", geoExcluded: "",
    reportDate: "",
    analystName: "", analystEmail: "", analystPhone: "",
    passkey: "",
  });

  useEffect(() => {
    if (project) setForm({
      title: project.title || "",
      clientName: project.clientName || "",
      industry: project.industry || "",
      geoAllowed: project.geoAllowed || "",
      geoExcluded: project.geoExcluded || "",
      reportDate: project.reportDate || "",
      analystName: project.analystName || "",
      analystEmail: project.analystEmail || "",
      analystPhone: project.analystPhone || "",
      passkey: "",
    });
  }, [project]);

  const update = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleSave = () => update.mutate({
    id: projectId,
    title: form.title,
    clientName: form.clientName,
    industry: form.industry || undefined,
    geoAllowed: form.geoAllowed || undefined,
    geoExcluded: form.geoExcluded || undefined,
    reportDate: form.reportDate || undefined,
    analystName: form.analystName || undefined,
    analystEmail: form.analystEmail || undefined,
    analystPhone: form.analystPhone || undefined,
    passkey: form.passkey || undefined,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={28} />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step A · Project Setup</h2>
        <p className="text-sm text-muted-foreground mt-1">Define the engagement context. This information appears on the client report cover.</p>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Project Title *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} onBlur={handleSave} placeholder="e.g. Fintech Innovation Scouting Q3 2025" />
          </div>
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} onBlur={handleSave} placeholder="e.g. Banco Santander" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Industry / Sector</Label>
            <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} onBlur={handleSave} placeholder="e.g. Financial Services" />
          </div>
          <div className="space-y-2">
            <Label>Report Date</Label>
            <Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} onBlur={handleSave} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Geo Allowed</Label>
            <Input value={form.geoAllowed} onChange={e => setForm(f => ({ ...f, geoAllowed: e.target.value }))} onBlur={handleSave} placeholder="e.g. LATAM, Europe" />
          </div>
          <div className="space-y-2">
            <Label>Geo Excluded</Label>
            <Input value={form.geoExcluded} onChange={e => setForm(f => ({ ...f, geoExcluded: e.target.value }))} onBlur={handleSave} placeholder="e.g. Russia, Iran" />
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <h3 className="font-semibold text-sm">Analyst Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.analystName} onChange={e => setForm(f => ({ ...f, analystName: e.target.value }))} onBlur={handleSave} placeholder="Analyst name" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.analystEmail} onChange={e => setForm(f => ({ ...f, analystEmail: e.target.value }))} onBlur={handleSave} placeholder="analyst@vclstudio.com" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.analystPhone} onChange={e => setForm(f => ({ ...f, analystPhone: e.target.value }))} onBlur={handleSave} placeholder="+1 555 000 0000" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Client Report Passkey</Label>
          <Input
            type="password"
            value={form.passkey}
            onChange={e => setForm(f => ({ ...f, passkey: e.target.value }))}
            placeholder="Set or update the passkey (leave blank to keep existing)"
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">Share this passkey with your client to access the published report. Stored securely (hashed). Min 6 characters.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={update.isPending || !form.title || !form.clientName} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          {update.isPending
            ? <Loader2 className="animate-spin mr-2" size={14} />
            : saved
            ? <CheckCircle2 size={14} className="mr-2" />
            : <Save size={14} className="mr-2" />}
          {saved ? "Saved!" : "Save"}
        </Button>
      </div>
    </div>
  );
}
