import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BookmarkCheck, Plus, Trash2, Users, ArrowRight, Share2, Copy, X, Pencil,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function CreateShortlistDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createMutation = trpc.shortlists.create.useMutation({
    onSuccess: () => { utils.shortlists.list.invalidate(); toast.success("Shortlist created"); onClose(); setName(""); setDescription(""); },
    onError: e => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Shortlist</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
            <Input placeholder="e.g. Campaign A Leads" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <Textarea placeholder="Optional description..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate({ name, description })}
            disabled={!name.trim() || createMutation.isPending}
            className="bg-[#FE4E03] hover:bg-[#e04400] text-white">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({ shortlist, open, onClose }: { shortlist: any; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const genMutation = trpc.shortlists.generateShareToken.useMutation({
    onSuccess: () => utils.shortlists.list.invalidate(),
    onError: e => toast.error(e.message),
  });
  const shareUrl = shortlist.shareToken
    ? `${window.location.origin}/shared/${shortlist.shareToken}`
    : null;
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share Shortlist</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-500 mb-4">
          Generate a shareable link for <strong>{shortlist.name}</strong>. Anyone with the link can view this shortlist.
        </p>
        {shareUrl ? (
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="text-xs" />
            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={() => genMutation.mutate({ id: shortlist.id })} disabled={genMutation.isPending}
            className="bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2">
            <Share2 className="h-4 w-4" /> Generate Share Link
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShortlistDetail({ shortlistId, onBack }: { shortlistId: number; onBack: () => void }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: shortlist, isLoading } = trpc.shortlists.get.useQuery({ id: shortlistId });
  const removeMutation = trpc.shortlists.removeTalent.useMutation({
    onSuccess: () => { utils.shortlists.get.invalidate({ id: shortlistId }); toast.success("Removed from shortlist"); },
    onError: e => toast.error(e.message),
  });
  const [shareOpen, setShareOpen] = useState(false);

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!shortlist) return <div className="p-6 text-gray-500">Shortlist not found.</div>;

  const talents = shortlist.talents ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE4E03] transition-colors mb-6">
        <X className="h-4 w-4" /> Back to Shortlists
      </button>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>{shortlist.name}</h1>
          {shortlist.description && <p className="text-gray-500 text-sm mt-1">{shortlist.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{talents.length} talent{talents.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-2 shrink-0">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      {talents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-border">
          <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No talent yet</h3>
          <p className="text-sm text-gray-400">Add talent from the Discover page.</p>
          <Button variant="ghost" onClick={() => setLocation("/discover")} className="mt-3 text-[#FE4E03]">
            Go to Discover
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {talents.map((t: any) => (
            <div key={t.id} className="talent-card">
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation(`/talent/${t.talentId}`)}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shrink-0"
                      style={{ background: "var(--vcl-orange)" }}>
                      {t.talent?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#292432] hover:text-[#FE4E03] transition-colors">{t.talent?.name}</p>
                      <p className="text-xs text-gray-500">{t.talent?.discipline}</p>
                    </div>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => removeMutation.mutate({ shortlistId, talentId: t.talentId })}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {t.talent?.location && (
                  <p className="text-xs text-gray-400">{t.talent.location}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareDialog shortlist={shortlist} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

export default function Shortlists() {
  const utils = trpc.useUtils();
  const { data: shortlists, isLoading } = trpc.shortlists.list.useQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const deleteMutation = trpc.shortlists.delete.useMutation({
    onSuccess: () => { utils.shortlists.list.invalidate(); toast.success("Shortlist deleted"); setDeleteId(null); },
    onError: e => toast.error(e.message),
  });

  if (selectedId !== null) {
    return <ShortlistDetail shortlistId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookmarkCheck className="h-5 w-5 text-[#FE4E03]" />
            <h1 className="text-2xl text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Shortlists</h1>
          </div>
          <p className="text-gray-500 text-sm">Organise and share curated talent collections</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2">
          <Plus className="h-4 w-4" /> New Shortlist
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : shortlists && shortlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortlists.map(sl => (
            <div key={sl.id} className="talent-card group cursor-pointer" onClick={() => setSelectedId(sl.id)}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--vcl-orange)" }}>
                    <BookmarkCheck className="h-5 w-5 text-white" />
                  </div>
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    onClick={e => { e.stopPropagation(); setDeleteId(sl.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <h3 className="font-bold text-[#292432] group-hover:text-[#FE4E03] transition-colors mb-1">{sl.name}</h3>
                {sl.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{sl.description}</p>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{(sl as any).talentCount ?? 0} talent{((sl as any).talentCount ?? 0) !== 1 ? "s" : ""}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#FE4E03] transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-border">
          <BookmarkCheck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No shortlists yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create your first shortlist to organise talent.</p>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2">
            <Plus className="h-4 w-4" /> Create Shortlist
          </Button>
        </div>
      )}

      <CreateShortlistDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <AlertDialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shortlist?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the shortlist and remove all talent from it. This action cannot be undone.</AlertDialogDescription>
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
