import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookmarkCheck, Send, Star, Compass, ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";

const LOGO_WHITE = "/manus-storage/vcl-logo-white_dd9fd788.png";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: recentTalents, isLoading: talentsLoading } = trpc.dashboard.recentTalents.useQuery();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero welcome banner */}
      <div className="rounded-2xl p-8 mb-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #292432 0%, #3d3550 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5"
          style={{ background: "radial-gradient(circle, #FE4E03 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <p className="text-[#FE4E03] text-sm font-semibold uppercase tracking-widest mb-2">VCL Studio</p>
          <h1 className="text-3xl text-white mb-2" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-gray-400 text-sm mb-6">Your scouting dashboard — discover, evaluate, and organise talent.</p>
          <Button onClick={() => setLocation("/discover")}
            className="bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2 font-semibold">
            <Compass className="h-4 w-4" /> Start Discovering
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          [
            { label: "Total Talent", value: stats?.totalTalents ?? 0, icon: <Users className="h-5 w-5" />, color: "text-blue-500", bg: "bg-blue-50", action: () => setLocation("/discover") },
            { label: "Shortlists", value: stats?.totalShortlists ?? 0, icon: <BookmarkCheck className="h-5 w-5" />, color: "text-[#FE4E03]", bg: "bg-orange-50", action: () => setLocation("/shortlists") },
            { label: "Submissions", value: stats?.pendingSubmissions ?? 0, icon: <Send className="h-5 w-5" />, color: "text-yellow-500", bg: "bg-yellow-50", action: () => setLocation("/submissions"), sublabel: "pending" },
            { label: "Avg Rating", value: stats?.avgRating ? Number(stats.avgRating).toFixed(1) : "—", icon: <Star className="h-5 w-5" />, color: "text-purple-500", bg: "bg-purple-50" },
          ].map(stat => (
            <div key={stat.label}
              className={`bg-white rounded-xl border border-border p-5 ${stat.action ? "cursor-pointer hover:border-[#FE4E03]/30 transition-colors" : ""}`}
              onClick={stat.action}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-black text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.sublabel ?? stat.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Recent talent */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <h2 className="font-bold text-[#292432]">Recently Added Talent</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/discover")} className="gap-1 text-[#FE4E03] hover:text-[#e04400]">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {talentsLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : recentTalents && recentTalents.length > 0 ? (
          <div className="divide-y divide-border">
            {recentTalents.map(t => (
              <div key={t.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/talent/${t.id}`)}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                  style={{ background: "var(--vcl-orange)" }}>
                  {t.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#292432] truncate">{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.discipline}{t.location ? ` · ${t.location}` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.availability === "available" ? "badge-available" :
                    t.availability === "busy" ? "badge-busy" : "badge-unavailable"
                  }`}>{t.availability}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No talent yet. Start by discovering or approving submissions.</p>
            <Button variant="ghost" onClick={() => setLocation("/discover")} className="mt-2 text-[#FE4E03]">
              Go to Discover
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
