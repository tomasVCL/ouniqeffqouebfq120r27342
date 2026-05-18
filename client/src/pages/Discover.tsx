import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookmarkPlus,
  Compass,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISCIPLINES = [
  "Actor", "Model", "Photographer", "Videographer", "Director",
  "Dancer", "Musician", "Influencer", "Content Creator", "Stylist",
  "Makeup Artist", "Art Director", "Illustrator", "Animator", "Other",
];

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {AVAILABILITY_LABELS[value] ?? value}
    </span>
  );
}

function TalentCard({
  talent,
  onView,
  onAddToShortlist,
}: {
  talent: any;
  onView: () => void;
  onAddToShortlist: () => void;
}) {

  return (
    <div className="talent-card cursor-pointer group" onClick={onView}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0"
              style={{ background: "var(--vcl-orange)" }}
            >
              {talent.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-[#292432] group-hover:text-[#FE4E03] transition-colors">
                {talent.name}
              </h3>
              <p className="text-sm text-gray-500">{talent.discipline}</p>
            </div>
          </div>
          <button
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-[#FE4E03] hover:bg-[#FE4E03]/10 transition-colors"
            onClick={e => { e.stopPropagation(); onAddToShortlist(); }}
            title="Add to shortlist"
          >
            <BookmarkPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-3">
          <AvailabilityBadge value={talent.availability} />
          <Badge variant="secondary" className="text-xs">
            {EXPERIENCE_LABELS[talent.experienceLevel] ?? talent.experienceLevel}
          </Badge>
          {talent.location && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {talent.location}
            </span>
          )}
        </div>

        {/* Bio */}
        {talent.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{talent.bio}</p>
        )}

        {/* Skills */}
        {talent.skills && talent.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(talent.skills as string[]).slice(0, 4).map((s: string) => (
              <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {s}
              </span>
            ))}
            {talent.skills.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                +{talent.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {talent.rateRange && (
            <span className="text-xs text-gray-500 font-medium">{talent.rateRange}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            talent.availability === "available" ? "badge-available" :
            talent.availability === "busy" ? "badge-busy" : "badge-unavailable"
          }`}>{talent.availability}</span>
        </div>
      </div>
    </div>
  );
}

// Add to Shortlist dialog
function AddToShortlistDialog({
  talentId,
  talentName,
  open,
  onClose,
}: {
  talentId: number;
  talentName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: shortlists } = trpc.shortlists.list.useQuery();
  const addMutation = trpc.shortlists.addTalent.useMutation({
    onSuccess: () => { toast.success(`Added to shortlist`); onClose(); },
    onError: e => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Shortlist</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 mb-3">
          Add <strong>{talentName}</strong> to one of your shortlists:
        </p>
        {!shortlists || shortlists.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No shortlists yet. Create one in the Shortlists section.
          </p>
        ) : (
          <div className="space-y-2">
            {shortlists.map(sl => (
              <button
                key={sl.id}
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

export default function Discover() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [availability, setAvailability] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [addToShortlist, setAddToShortlist] = useState<{ id: number; name: string } | null>(null);

  const filters = useMemo(() => ({
    search: search || undefined,
    discipline: (discipline && discipline !== "all") ? discipline : undefined,
    availability: (availability && availability !== "all") ? availability : undefined,
    experienceLevel: (experienceLevel && experienceLevel !== "all") ? experienceLevel : undefined,
  }), [search, discipline, availability, experienceLevel]);

  const { data: talents, isLoading } = trpc.talents.list.useQuery(filters);

  const hasFilters = search || (discipline && discipline !== "all") || (availability && availability !== "all") || (experienceLevel && experienceLevel !== "all");

  function clearFilters() {
    setSearch("");
    setDiscipline("");
    setAvailability("");
    setExperienceLevel("");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-5 w-5 text-[#FE4E03]" />
          <h1 className="text-2xl text-[#292432]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Discover Talent
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          Browse and filter our curated talent database
          {talents && ` · ${talents.length} talent${talents.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, bio, discipline..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All disciplines</SelectItem>
              {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={experienceLevel} onValueChange={setExperienceLevel}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any level</SelectItem>
              <SelectItem value="emerging">Emerging</SelectItem>
              <SelectItem value="mid">Mid-level</SelectItem>
              <SelectItem value="established">Established</SelectItem>
              <SelectItem value="star">Star</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : talents && talents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {talents.map(talent => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onView={() => setLocation(`/talent/${talent.id}`)}
              onAddToShortlist={() => setAddToShortlist({ id: talent.id, name: talent.name })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Compass className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No talent found</h3>
          <p className="text-sm text-gray-400">
            {hasFilters
              ? "Try adjusting your filters or search terms"
              : "No approved talent profiles yet. Approve submissions in the Admin panel."}
          </p>
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="mt-3 text-[#FE4E03]">
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Add to shortlist dialog */}
      {addToShortlist && (
        <AddToShortlistDialog
          talentId={addToShortlist.id}
          talentName={addToShortlist.name}
          open={!!addToShortlist}
          onClose={() => setAddToShortlist(null)}
        />
      )}
    </div>
  );
}
