import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookmarkPlus,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Pencil,
  Play,
  Star,
  Trash2,
  Youtube,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const EXPERIENCE_LABELS: Record<string, string> = {
  emerging: "Emerging",
  mid: "Mid-level",
  established: "Established",
  star: "Star",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  busy: "Busy",
  unavailable: "Unavailable",
};

function AvailabilityBadge({ value }: { value: string }) {
  const cls =
    value === "available" ? "badge-available" :
    value === "busy" ? "badge-busy" : "badge-unavailable";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${cls}`}>
      {AVAILABILITY_LABELS[value] ?? value}
    </span>
  );
}

function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          className="p-0.5 transition-transform hover:scale-110"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(value === i ? null : i)}
        >
          <Star className={`h-5 w-5 transition-colors ${i <= (hover ?? value ?? 0) ? "star-filled fill-current" : "star-empty"}`} />
        </button>
      ))}
      {value && (
        <button type="button" className="ml-1 text-xs text-gray-400 hover:text-gray-600" onClick={() => onChange(null)}>
          clear
        </button>
      )}
    </div>
  );
}

function AddToShortlistDialog({ talentId, talentName, open, onClose }: {
  talentId: number; talentName: string; open: boolean; onClose: () => void;
}) {
  const { data: shortlists } = trpc.shortlists.list.useQuery();
  const addMutation = trpc.shortlists.addTalent.useMutation({
    onSuccess: () => { toast.success("Added to shortlist"); onClose(); },
    onError: e => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add to Shortlist</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-500 mb-3">Add <strong>{talentName}</strong> to a shortlist:</p>
        {!shortlists || shortlists.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No shortlists yet. Create one in the Shortlists section.</p>
        ) : (
          <div className="space-y-2">
            {shortlists.map(sl => (
              <button key={sl.id}
                className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-[#FE4E03] hover:bg-[#FE4E03]/5 transition-colors"
                onClick={() => addMutation.mutate({ shortlistId: sl.id, talentId })}
                disabled={addMutation.isPending}
              >
                <p className="font-medium text-sm">{sl.name}</p>
                {sl.description && <p className="text-xs text-gray-400 mt-0.5">{sl.description}</p>}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotesSection({ talentId }: { talentId: number }) {
  const utils = trpc.useUtils();
  const { data: notes, isLoading } = trpc.notes.list.useQuery({ talentId });
  const [noteText, setNoteText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState<number | null>(null);

  const createMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ talentId });
      utils.talents.getRating.invalidate({ talentId });
      setNoteText(""); setRating(null);
      toast.success("Note saved");
    },
    onError: e => toast.error(e.message),
  });
  const updateMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ talentId });
      utils.talents.getRating.invalidate({ talentId });
      setEditId(null); toast.success("Note updated");
    },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      utils.notes.list.invalidate({ talentId });
      utils.talents.getRating.invalidate({ talentId });
      toast.success("Note deleted");
    },
    onError: e => toast.error(e.message),
  });

  return (
    <div>
      <h3 className="font-bold text-[#292432] mb-3" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
        My Notes <span className="ml-2 text-xs text-gray-400 font-normal">(private — only visible to you)</span>
      </h3>
      <div className="bg-white rounded-xl border border-border p-4 mb-4">
        <Textarea placeholder="Add a private note about this talent..." value={noteText}
          onChange={e => setNoteText(e.target.value)} rows={3} className="mb-3 resize-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rating:</span>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <Button size="sm"
            onClick={() => createMutation.mutate({ talentId, note: noteText, rating: rating ?? undefined })}
            disabled={!noteText.trim() || createMutation.isPending}
            className="bg-[#FE4E03] hover:bg-[#e04400] text-white">
            Save Note
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-border p-4">
              {editId === note.id ? (
                <div>
                  <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} className="mb-3 resize-none" />
                  <div className="flex items-center justify-between">
                    <StarInput value={editRating} onChange={setEditRating} />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                      <Button size="sm"
                        onClick={() => updateMutation.mutate({ id: note.id, note: editText, rating: editRating })}
                        disabled={!editText.trim() || updateMutation.isPending}
                        className="bg-[#FE4E03] hover:bg-[#e04400] text-white">Update</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{note.note}</p>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1 text-gray-400 hover:text-[#FE4E03] transition-colors"
                        onClick={() => { setEditId(note.id); setEditText(note.note); setEditRating(note.rating ?? null); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => deleteMutation.mutate({ id: note.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {note.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= note.rating! ? "star-filled fill-current" : "star-empty"}`} />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">No notes yet. Add your first note above.</p>
      )}
    </div>
  );
}

export default function TalentProfile() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const talentId = parseInt(params.id ?? "0", 10);
  const [shortlistOpen, setShortlistOpen] = useState(false);

  const { data: talent, isLoading } = trpc.talents.get.useQuery({ id: talentId });
  const { data: ratingData } = trpc.talents.getRating.useQuery({ talentId });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Talent not found.</p>
        <Button variant="ghost" onClick={() => setLocation("/discover")} className="mt-2">Back to Discover</Button>
      </div>
    );
  }

  const media = (talent.portfolioMedia as Array<{ type: "image" | "video"; url: string; caption?: string }>) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => setLocation("/discover")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE4E03] transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Discover
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-4 mx-auto"
              style={{ background: "var(--vcl-orange)" }}>
              {talent.name[0].toUpperCase()}
            </div>
            <h1 className="text-xl text-center text-[#292432] mb-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              {talent.name}
            </h1>
            <p className="text-center text-gray-500 text-sm mb-3">{talent.discipline}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <AvailabilityBadge value={talent.availability} />
              <Badge variant="secondary">{EXPERIENCE_LABELS[talent.experienceLevel]}</Badge>
            </div>
            {ratingData && Number(ratingData.count) > 0 && (
              <div className="flex items-center justify-center gap-1.5 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(Number(ratingData.avg)) ? "star-filled fill-current" : "star-empty"}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500">{Number(ratingData.avg).toFixed(1)} ({ratingData.count})</span>
              </div>
            )}
            {talent.location && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4" /> {talent.location}
              </div>
            )}
            {talent.dayRate && (
              <div className="text-center text-sm font-semibold text-[#292432] mb-4">
                {talent.currency ?? "USD"} {talent.dayRate.toLocaleString()} / day
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {talent.portfolioUrl && (
                <a href={talent.portfolioUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FE4E03] hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </a>
              )}
              {talent.instagramHandle && (
                <a href={`https://instagram.com/${talent.instagramHandle.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FE4E03] hover:underline">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {talent.tiktokHandle && (
                <a href={`https://tiktok.com/@${talent.tiktokHandle.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FE4E03] hover:underline">
                  <Play className="h-3.5 w-3.5" /> TikTok
                </a>
              )}
              {talent.youtubeHandle && (
                <a href={`https://youtube.com/@${talent.youtubeHandle.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FE4E03] hover:underline">
                  <Youtube className="h-3.5 w-3.5" /> YouTube
                </a>
              )}
              {talent.linkedinUrl && (
                <a href={talent.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[#FE4E03] hover:underline">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
            {(talent.email || talent.phone) && (
              <div className="border-t border-border pt-4 space-y-1 text-sm text-gray-600">
                {talent.email && <p><span className="text-gray-400">Email:</span> {talent.email}</p>}
                {talent.phone && <p><span className="text-gray-400">Phone:</span> {talent.phone}</p>}
              </div>
            )}
            <Button className="w-full mt-4 bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2"
              onClick={() => setShortlistOpen(true)}>
              <BookmarkPlus className="h-4 w-4" /> Add to Shortlist
            </Button>
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-6">
          {talent.bio && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold text-[#292432] mb-3" style={{ fontFamily: "'Archivo Black', sans-serif" }}>About</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{talent.bio}</p>
            </div>
          )}
          {talent.skills && (talent.skills as string[]).length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold text-[#292432] mb-3" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(talent.skills as string[]).map((skill: string) => (
                  <span key={skill} className="px-3 py-1 rounded-full text-sm font-medium bg-[#FE4E03]/10 text-[#FE4E03]">{skill}</span>
                ))}
              </div>
            </div>
          )}
          {media.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="font-bold text-[#292432] mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {media.map((item, idx) => (
                  <div key={idx} className="group relative rounded-lg overflow-hidden bg-gray-100 aspect-square">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.caption ?? `Portfolio ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 hover:text-[#FE4E03] transition-colors">
                        <Play className="h-8 w-8" />
                        <span className="text-xs">Watch video</span>
                      </a>
                    )}
                    {item.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-[#F5F5F7] rounded-xl border border-border p-6">
            <NotesSection talentId={talentId} />
          </div>
        </div>
      </div>

      <AddToShortlistDialog talentId={talentId} talentName={talent.name} open={shortlistOpen} onClose={() => setShortlistOpen(false)} />
    </div>
  );
}
