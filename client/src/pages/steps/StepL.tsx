import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Lock, Copy, ExternalLink, Eye } from "lucide-react";

export default function StepL({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });
  const [passkey, setPasskey] = useState("");
  const [copied, setCopied] = useState(false);

  // Use publish.toggle to publish/unpublish
  const publish = trpc.publish.toggle.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      toast.success("Project published! Client portal is now live.");
      setPasskey("");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const unpublish = trpc.publish.toggle.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      toast.success("Project unpublished.");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // Client URL: /client/:projectId (passkey entered on that page)
  const clientUrl = project ? `${window.location.origin}/client/${project.id}` : null;

  const copyUrl = () => {
    if (clientUrl) {
      navigator.clipboard.writeText(clientUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>;

  const isPublished = project?.published;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-display font-black">Step L · Publish to Client Portal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a passkey-protected client report URL. The client portal shows only finalized content — no internal scoring data or AI comparison views.
        </p>
      </div>
      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isPublished ? "oklch(60.0% 0.140 145.0 / 0.15)" : "var(--muted)" }}>
          {isPublished ? <Globe size={18} style={{ color: "oklch(60.0% 0.140 145.0)" }} /> : <Lock size={18} className="text-muted-foreground" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{project?.title}</span>
            <Badge className="text-xs" style={isPublished ? { background: "oklch(60.0% 0.140 145.0 / 0.15)", color: "oklch(60.0% 0.140 145.0)", border: "1px solid oklch(60.0% 0.140 145.0 / 0.3)" } : {}}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{isPublished ? "Client portal is live and accessible with the passkey." : "Not yet published. Set a passkey and publish to make the client portal live."}</p>
        </div>
      </div>
      {isPublished && clientUrl && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "oklch(60.0% 0.140 145.0 / 0.3)", background: "oklch(60.0% 0.140 145.0 / 0.05)" }}>
          <p className="text-sm font-semibold" style={{ color: "oklch(60.0% 0.140 145.0)" }}>Client Portal URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono break-all" style={{ background: "var(--muted)" }}>{clientUrl}</code>
            <Button size="sm" variant="outline" onClick={copyUrl}><Copy size={12} className="mr-1" />{copied ? "Copied!" : "Copy"}</Button>
            <Button size="sm" variant="outline" onClick={() => window.open(clientUrl, "_blank")}><ExternalLink size={12} /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Share this URL with your client. They will be prompted to enter the passkey you set.</p>
        </div>
      )}
      {!isPublished ? (
        <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <h3 className="font-semibold text-sm">Publish Project</h3>
          <div className="space-y-1">
            <Label>Client Passkey</Label>
            <Input type="password" value={passkey} onChange={e => setPasskey(e.target.value)} placeholder="Set a passkey for your client (min. 6 characters)" />
            <p className="text-xs text-muted-foreground">This passkey is hashed server-side and never exposed in the URL. Share it separately with your client.</p>
          </div>
          <Button
            onClick={() => passkey.length >= 6 && publish.mutate({ projectId, publish: true })}
            disabled={passkey.length < 6 || publish.isPending}
            style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
          >
            {publish.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Globe size={14} className="mr-2" />}
            Publish to Client Portal
          </Button>
          {passkey.length > 0 && passkey.length < 6 && <p className="text-xs" style={{ color: "oklch(55.0% 0.200 25.0)" }}>Passkey must be at least 6 characters.</p>}
          <p className="text-xs text-muted-foreground">Note: You must set a passkey in Step A before publishing.</p>
        </div>
      ) : (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <h3 className="font-semibold text-sm">Manage Publication</h3>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => window.open(clientUrl!, "_blank")}><Eye size={14} className="mr-2" />Preview Client Portal</Button>
            <Button variant="outline" onClick={() => unpublish.mutate({ projectId, publish: false })} disabled={unpublish.isPending} className="text-destructive border-destructive/30 hover:bg-destructive/10">
              {unpublish.isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Lock size={14} className="mr-2" />}
              Unpublish
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Unpublishing will immediately revoke client access. You can re-publish at any time with a new passkey.</p>
        </div>
      )}
    </div>
  );
}
