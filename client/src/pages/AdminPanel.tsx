import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield, Users, CheckCircle2, XCircle, Pencil, Trash2, Eye,
  Search, UserCog, Send, Star, LayoutDashboard,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

function TalentManagementTab() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const { data: talents, isLoading } = trpc.talents.list.useQuery({ search: search || undefined });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deleteMutation = trpc.admin.deleteTalent.useMutation({
    onSuccess: () => { utils.talents.list.invalidate(); toast.success("Talent deleted"); setDeleteId(null); },
    onError: e => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search talent..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <span className="text-sm text-gray-500">{talents?.length ?? 0} records</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      ) : talents && talents.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Discipline</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Availability</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {talents.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "var(--vcl-orange)" }}>
                        {t.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#292432]">{t.name}</p>
                        {t.location && <p className="text-xs text-gray-400">{t.location}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{t.discipline}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.availability === "available" ? "badge-available" :
                      t.availability === "busy" ? "badge-busy" : "badge-unavailable"
                    }`}>{t.availability}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                    {format(new Date(t.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-[#FE4E03] transition-colors"
                        onClick={() => setLocation(`/talent/${t.id}`)}>
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No talent records found.</p>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Talent?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this talent profile and all associated notes, ratings, and shortlist entries.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();
  const promoteMutation = trpc.admin.promoteUser.useMutation({
    onSuccess: () => { utils.admin.listUsers.invalidate(); toast.success("User role updated"); },
    onError: e => toast.error(e.message),
  });

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
      ) : users && users.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Last Sign In</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: u.role === "admin" ? "var(--vcl-orange)" : "#6B7280" }}>
                        {u.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <p className="font-semibold text-sm text-[#292432]">{u.name ?? "Unknown"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge className={u.role === "admin" ? "bg-[#FE4E03]/10 text-[#FE4E03] border-[#FE4E03]/20" : "bg-gray-100 text-gray-600 border-gray-200"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                    {format(new Date(u.lastSignedIn), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm"
                      onClick={() => promoteMutation.mutate({ userId: u.id, role: u.role === "admin" ? "user" : "admin" })}
                      disabled={promoteMutation.isPending}
                      className="text-xs gap-1">
                      <UserCog className="h-3.5 w-3.5" />
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-border">
          <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No users found.</p>
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <Shield className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-400 mb-2">Access Restricted</h2>
        <p className="text-gray-400 text-sm">You need admin privileges to access this panel.</p>
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mt-3">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="h-5 w-5 text-[#FE4E03]" />
        <h1 className="text-2xl text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Admin Panel</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">Manage talent records and user roles</p>

      <Tabs defaultValue="talent">
        <TabsList className="mb-6">
          <TabsTrigger value="talent" className="gap-2">
            <Users className="h-4 w-4" /> Talent Records
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserCog className="h-4 w-4" /> Users & Roles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="talent">
          <TalentManagementTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
