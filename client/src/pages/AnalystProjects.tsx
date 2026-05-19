import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AnalystLayout from "@/components/AnalystLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Trash2,
  ArrowRight,
  Globe,
  Loader2,
  FolderOpen,
} from "lucide-react";

export default function AnalystProjects() {
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", clientName: "", industry: "", passkey: "" });
  const utils = trpc.useUtils();

  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: ({ id }) => {
      utils.projects.list.invalidate();
      setShowCreate(false);
      setForm({ title: "", clientName: "", industry: "", passkey: "" });
      navigate(`/analyst/projects/${id}`);
      toast.success("Project created");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      toast.success("Project deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.clientName) {
      toast.error("Title and client name are required");
      return;
    }
    createProject.mutate(form);
  };

  return (
    <AnalystLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your innovation scouting engagements
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
          >
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-vcl-orange" size={32} />
          </div>
        ) : !projects?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(62.8% 0.218 38.4 / 0.1)" }}
            >
              <FolderOpen size={28} style={{ color: "oklch(62.8% 0.218 38.4)" }} />
            </div>
            <h3 className="font-semibold text-lg">No projects yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Create your first scouting project to get started.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
            >
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card
                key={p.id}
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer border"
                onClick={() => navigate(`/analyst/projects/${p.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate">
                        {p.title}
                      </CardTitle>
                      <CardDescription className="truncate">{p.clientName}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            if (confirm(`Delete "${p.title}"? This cannot be undone.`)) {
                              deleteProject.mutate({ id: p.id });
                            }
                          }}
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {p.industry && (
                    <p className="text-xs text-muted-foreground">{p.industry}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.published ? (
                      <Badge className="text-xs" style={{ background: "oklch(62.0% 0.140 145.0 / 0.15)", color: "oklch(42.0% 0.120 145.0)", border: "1px solid oklch(62.0% 0.140 145.0 / 0.3)" }}>
                        <Globe size={10} className="mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Draft</Badge>
                    )}
                    {p.reportDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.reportDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-medium flex items-center gap-1" style={{ color: "oklch(62.8% 0.218 38.4)" }}>
                      Open workspace
                      <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Scouting Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Fintech Innovation Scouting Q3 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                placeholder="e.g. Banco Santander"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                placeholder="e.g. Financial Services"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passkey">Client Report Passkey</Label>
              <Input
                id="passkey"
                type="password"
                value={form.passkey}
                onChange={e => setForm(f => ({ ...f, passkey: e.target.value }))}
                placeholder="Min 6 characters (required to publish)"
              />
              <p className="text-xs text-muted-foreground">
                Share this passkey with your client to access the report. Can be set later.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
                disabled={createProject.isPending}
              >
                {createProject.isPending && <Loader2 className="animate-spin mr-2" size={14} />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AnalystLayout>
  );
}
