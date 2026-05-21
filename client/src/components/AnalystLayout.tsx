import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LOGO_WHITE = "/manus-storage/vcl-logo-white_96a5cf7b.png";
const LOGO_DARK  = "/manus-storage/vcl-logo-dark_5aaa0a93.png";

const NAV_ITEMS = [
  { href: "/analyst/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyst/projects",  label: "Projects",  icon: FolderOpen },
];

interface Props {
  children: React.ReactNode;
  projectTitle?: string;
  projectId?: number;
  currentStep?: number;
  totalSteps?: number;
}

export default function AnalystLayout({ children, projectTitle, projectId, currentStep, totalSteps }: Props) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: meData, isLoading: meLoading } = trpc.analyst.me.useQuery();
  useEffect(() => {
    if (!meLoading && meData && !meData.authenticated) {
      navigate("/login");
    }
  }, [meData, meLoading, navigate]);
  const logout = trpc.analyst.logout.useMutation({
    onSuccess: () => { navigate("/login"); },
    onError: () => toast.error("Logout failed"),
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <img src={LOGO_WHITE} alt="VCL Studio" className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-vcl-orange text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-150 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0"
        style={{ background: "var(--sidebar-background)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ background: "var(--sidebar-background)" }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header
          className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b shrink-0"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-muted-foreground">Projects</span>
            {projectTitle && (
              <>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{projectTitle}</span>
              </>
            )}
            {currentStep !== undefined && totalSteps !== undefined && (
              <>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  Step {currentStep}/{totalSteps}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <img src={LOGO_DARK} alt="VCL Studio" className="h-6 w-auto opacity-60 hidden sm:block" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
