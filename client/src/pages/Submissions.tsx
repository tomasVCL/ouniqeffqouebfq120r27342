import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Send, CheckCircle2, XCircle, Clock, Eye, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
}

function SubmissionDetail({ submission, onClose, onApprove, onReject, isAdmin }: {
  submission: any; onClose: () => void;
  onApprove: () => void; onReject: () => void; isAdmin: boolean;
}) {
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {submission.name}
            <StatusBadge status={submission.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Email:</span> <span className="font-medium">{submission.email}</span></div>
            {submission.phone && <div><span className="text-gray-400">Phone:</span> <span className="font-medium">{submission.phone}</span></div>}
            <div><span className="text-gray-400">Discipline:</span> <span className="font-medium">{submission.discipline}</span></div>
            {submission.location && <div><span className="text-gray-400">Location:</span> <span className="font-medium">{submission.location}</span></div>}
          </div>
          {submission.bio && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Bio</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{submission.bio}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {submission.portfolioUrl && (
              <a href={submission.portfolioUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#FE4E03] hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Portfolio
              </a>
            )}
            {submission.instagramHandle && (
              <a href={`https://instagram.com/${submission.instagramHandle.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#FE4E03] hover:underline">
                Instagram
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400">Submitted {format(new Date(submission.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
          {isAdmin && submission.status === "pending" && (
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2" onClick={onApprove}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2" onClick={onReject}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Submissions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const { data: submissions, isLoading } = trpc.submissions.list.useQuery();
  const [selected, setSelected] = useState<any>(null);

  const approveMutation = trpc.submissions.approve.useMutation({
    onSuccess: () => { utils.submissions.list.invalidate(); toast.success("Submission approved and talent profile created"); setSelected(null); },
    onError: e => toast.error(e.message),
  });
  const rejectMutation = trpc.submissions.reject.useMutation({
    onSuccess: () => { utils.submissions.list.invalidate(); toast.success("Submission rejected"); setSelected(null); },
    onError: e => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-5 w-5 text-[#FE4E03]" />
            <h1 className="text-2xl text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Submissions</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {isAdmin ? "Review and approve talent applications" : "Incoming talent applications"}
          </p>
        </div>
        <a href="/submit" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" /> View Submission Form
          </Button>
        </a>
      </div>

      {/* Stats */}
      {submissions && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", count: submissions.length, icon: <Send className="h-5 w-5" />, color: "text-gray-500" },
            { label: "Pending", count: submissions.filter(s => s.status === "pending").length, icon: <Clock className="h-5 w-5" />, color: "text-yellow-500" },
            { label: "Approved", count: submissions.filter(s => s.status === "approved").length, icon: <CheckCircle2 className="h-5 w-5" />, color: "text-green-500" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
              <div className={stat.color}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-black text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{stat.count}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : submissions && submissions.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Discipline</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Location</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Submitted</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-[#292432]">{sub.name}</p>
                      <p className="text-xs text-gray-400">{sub.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{sub.discipline}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{sub.location ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                    {format(new Date(sub.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-gray-400 hover:text-[#FE4E03] transition-colors"
                      onClick={() => setSelected(sub)}>
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-border">
          <Send className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No submissions yet</h3>
          <p className="text-sm text-gray-400">Share the submission form link to start receiving applications.</p>
        </div>
      )}

      {selected && (
        <SubmissionDetail
          submission={selected}
          onClose={() => setSelected(null)}
          onApprove={() => approveMutation.mutate({ id: selected.id })}
          onReject={() => rejectMutation.mutate({ id: selected.id })}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
