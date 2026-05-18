import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BookmarkCheck, Compass, LayoutDashboard, LogOut, Menu, Send, Shield, User, X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

const LOGO_WHITE = "/manus-storage/vcl-logo-white_dd9fd788.png";
const ISOTIPO = "/manus-storage/vcl-isotipo_2af88b65.png";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Discover", icon: Compass, href: "/discover" },
  { label: "Shortlists", icon: BookmarkCheck, href: "/shortlists" },
  { label: "Submissions", icon: Send, href: "/submissions" },
];

const ADMIN_NAV = { label: "Admin", icon: Shield, href: "/admin" };

function NavItem({ item, active, onClick }: {
  item: { label: string; icon: any; href: string };
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onClick}>
      <div className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
        active
          ? "bg-[#FE4E03] text-white shadow-sm"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      )}>
        <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
        <span>{item.label}</span>
      </div>
    </Link>
  );
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location === "/" || location === "/dashboard";
    return location.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#292432" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <img src={LOGO_WHITE} alt="VCL Studio" className="h-7 object-contain" />
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors lg:hidden">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1.5 font-medium tracking-wider uppercase">Scouting Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
        ))}

        {/* Admin section - role-gated */}
        {user?.role === "admin" && (
          <div className="pt-3 mt-3 border-t border-white/10">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-2 font-semibold">Admin</p>
            <NavItem item={ADMIN_NAV} active={isActive(ADMIN_NAV.href)} onClick={onClose} />
          </div>
        )}
      </nav>

      {/* User profile */}
      <div className="px-3 pb-5 border-t border-white/10 pt-3">
        {user ? (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "#FE4E03" }}>
              {user.name?.[0]?.toUpperCase() ?? <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name ?? "Scout"}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
            </div>
            <button onClick={() => logout()} className="text-gray-500 hover:text-white transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="px-3 py-2">
            <Skeleton className="h-8 w-full rounded-lg bg-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F5F7" }}>
      <div className="bg-white rounded-2xl border border-border p-10 max-w-sm w-full text-center shadow-sm">
        <img src="/manus-storage/vcl-logo-dark_4c25d8f0.png" alt="VCL Studio" className="h-10 mx-auto mb-6" />
        <h2 className="text-xl text-[#292432] mb-2" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
          Sign in to continue
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Access the VCL Studio Scouting Platform with your Manus account.
        </p>
        <a href={getLoginUrl()}>
          <Button className="w-full bg-[#FE4E03] hover:bg-[#e04400] text-white font-semibold py-2.5">
            Sign in with Manus
          </Button>
        </a>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F5F7" }}>
        <div className="flex flex-col items-center gap-3">
          <img src={ISOTIPO} alt="VCL Studio" className="h-12 animate-pulse" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F5F5F7" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-full">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-[#292432] transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <img src={ISOTIPO} alt="VCL Studio" className="h-7" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
