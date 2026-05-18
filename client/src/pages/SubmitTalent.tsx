import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";

const LOGO_DARK = "/manus-storage/vcl-logo-dark_4c25d8f0.png";
const LOGO_ORANGE = "/manus-storage/vcl-logo-orange_54002be0.png";

const DISCIPLINES = [
  "Actor", "Model", "Photographer", "Videographer", "Director",
  "Dancer", "Musician", "Influencer", "Content Creator", "Stylist",
  "Makeup Artist", "Art Director", "Illustrator", "Animator", "Other",
];

export default function SubmitTalent() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", discipline: "",
    bio: "", portfolioUrl: "", instagramHandle: "", location: "",
  });

  const submitMutation = trpc.submissions.create.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: e => toast.error(e.message),
  });

  function handleChange(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.discipline) {
      toast.error("Please fill in all required fields");
      return;
    }
    submitMutation.mutate(form);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F5F7" }}>
        <div className="bg-white rounded-2xl border border-border p-10 max-w-md w-full text-center shadow-sm">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FE4E03" }}>
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl text-[#292432] mb-2" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Submission Received!
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Thank you for submitting your profile to VCL Studio. Our team will review your application and get back to you soon.
          </p>
          <img src={LOGO_DARK} alt="VCL Studio" className="h-8 mx-auto opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#F5F5F7" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={LOGO_DARK} alt="VCL Studio" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl text-[#292432] mb-2" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
            Join Our Talent Roster
          </h1>
          <p className="text-gray-500">
            Submit your profile to be considered for projects with VCL Studio.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-6">
            {/* Personal info */}
            <div>
              <h2 className="font-bold text-[#292432] mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
                  <Input placeholder="Your full name" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                  <Input type="email" placeholder="your@email.com" value={form.email} onChange={e => handleChange("email", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                  <Input placeholder="+1 234 567 8900" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                  <Input placeholder="City, Country" value={form.location} onChange={e => handleChange("location", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Professional info */}
            <div>
              <h2 className="font-bold text-[#292432] mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                Professional Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Discipline *</label>
                  <Select value={form.discipline} onValueChange={v => handleChange("discipline", v)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Bio</label>
                  <Textarea
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                    value={form.bio}
                    onChange={e => handleChange("bio", e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h2 className="font-bold text-[#292432] mb-4" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                Portfolio & Social Links
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Portfolio URL</label>
                  <Input placeholder="https://yourportfolio.com" value={form.portfolioUrl} onChange={e => handleChange("portfolioUrl", e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Instagram Handle</label>
                  <Input placeholder="@yourhandle" value={form.instagramHandle} onChange={e => handleChange("instagramHandle", e.target.value)} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitMutation.isPending}
                className="w-full bg-[#FE4E03] hover:bg-[#e04400] text-white gap-2 py-3 text-base font-semibold">
                <Send className="h-5 w-5" />
                {submitMutation.isPending ? "Submitting..." : "Submit Profile"}
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3">
                By submitting, you agree to allow VCL Studio to store and use your information for talent scouting purposes.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
