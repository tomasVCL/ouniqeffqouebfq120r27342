import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, FolderOpen, Globe, Clock, Plus, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const LOGO_DARK = "/manus-storage/vcl_01_dark.png";

export default function AnalystDashboard() {
  const [, navigate] = useLocation();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const total = projects?.length ?? 0;
  const published = projects?.filter(p => p.published).length ?? 0;
  const drafts = total - published;
  const recent = projects?.slice(0, 5) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <img src={LOGO_DARK} alt="VCL Studio" className="h-8 mb-3" />
          <h1 className="text-2xl font-display font-black">Innovation Scouting</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyst workspace — manage your scouting engagements</p>
        </div>
        <Button onClick={() => navigate("/analyst/projects")} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
          <Plus size={14} className="mr-2" />New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Projects", value: total, icon: FolderOpen, color: "oklch(62.8% 0.218 38.4)" },
          { label: "Published", value: published, icon: Globe, color: "oklch(60.0% 0.140 145.0)" },
          { label: "In Progress", value: drafts, icon: Clock, color: "oklch(78.5% 0.175 75.0)" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: stat.color + "15" }}>
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-lg">Recent Projects</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/analyst/projects")} className="text-muted-foreground hover:text-foreground">
            View all <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={24} /></div>
        ) : !recent.length ? (
          <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <BarChart3 size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No projects yet. Create your first scouting engagement.</p>
            <Button onClick={() => navigate("/analyst/projects")} className="mt-4" style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
              <Plus size={14} className="mr-2" />Create Project
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(project => (
              <div
                key={project.id}
                className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:border-orange-300 transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
                onClick={() => navigate(`/analyst/projects/${project.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm truncate">{project.title}</span>
                    <Badge className="text-xs shrink-0" style={project.published ? { background: "oklch(60.0% 0.140 145.0 / 0.15)", color: "oklch(60.0% 0.140 145.0)", border: "1px solid oklch(60.0% 0.140 145.0 / 0.3)" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                      {project.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {project.clientName && <span>{project.clientName}</span>}
                    {project.industry && <span>· {project.industry}</span>}
                    <span>· Updated {formatDistanceToNow(new Date(project.updatedAt))} ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
