import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookmarkCheck, ArrowLeft } from "lucide-react";

const LOGO_DARK = "/manus-storage/vcl-logo-dark_4c25d8f0.png";

export default function SharedShortlist() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.shortlists.getByToken.useQuery({ token: params.token ?? "" });

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ background: "#F5F5F7" }}>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F5F7" }}>
        <div className="text-center">
          <BookmarkCheck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-400 mb-2">Shortlist Not Found</h2>
          <p className="text-gray-400 text-sm">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const talents = data.talents ?? [];

  return (
    <div className="min-h-screen p-6" style={{ background: "#F5F5F7" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-8" />
          <span className="text-xs text-gray-400 bg-white border border-border px-3 py-1 rounded-full">Shared Shortlist</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl text-[#292432] mb-1" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            {data.name}
          </h1>
          {data.description && <p className="text-gray-500 text-sm">{data.description}</p>}
          <p className="text-xs text-gray-400 mt-1">{talents.length} talent{talents.length !== 1 ? "s" : ""}</p>
        </div>

        {talents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-border">
            <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">This shortlist is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {talents.map((item: any) => {
              const t = item.talent;
              if (!t) return null;
              return (
                <div key={item.id} className="bg-white rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-black shrink-0"
                      style={{ background: "#FE4E03" }}>
                      {t.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#292432]">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.discipline}</p>
                    </div>
                  </div>
                  {t.bio && <p className="text-xs text-gray-500 line-clamp-3 mb-3">{t.bio}</p>}
                  <div className="flex flex-wrap gap-1">
                    {t.location && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.location}</span>
                    )}
                    {t.experienceLevel && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.experienceLevel}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.availability === "available" ? "bg-green-100 text-green-700" :
                      t.availability === "busy" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>{t.availability}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-10">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-6 mx-auto opacity-40" />
          <p className="text-xs text-gray-400 mt-1">Powered by VCL Studio Scouting Platform</p>
        </div>
      </div>
    </div>
  );
}
