import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Lock, User } from "lucide-react";

const LOGO_DARK  = "/manus-storage/vcl-logo-dark_5aaa0a93.png";
const ISOTIPO    = "/manus-storage/vcl-isotipo_24d37529.png";

export default function AnalystLogin() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: setupCheck, isLoading: checkingSetup } = trpc.analyst.needsSetup.useQuery();
  const needsSetup = setupCheck?.needsSetup ?? false;

  const { data: meData } = trpc.analyst.me.useQuery();
  useEffect(() => {
    if (meData?.authenticated) navigate("/analyst/projects");
  }, [meData, navigate]);

  const setup = trpc.analyst.setup.useMutation({
    onSuccess: () => {
      // Auto-login after setup
      login.mutate({ username, password });
    },
    onError: (e) => toast.error(e.message),
  });

  const login = trpc.analyst.login.useMutation({
    onSuccess: () => navigate("/analyst/projects"),
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsSetup) {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      setup.mutate({ username, password });
    } else {
      login.mutate({ username, password });
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-vcl-orange" size={32} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--vcl-dark, #292432)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(62.8% 0.218 38.4), transparent)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, oklch(78.5% 0.175 75.0), transparent)" }}
        />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <img src={ISOTIPO} alt="VCL studio" className="h-16 w-auto mx-auto" />
          <img src={LOGO_DARK} alt="VCL studio" className="h-10 w-auto mx-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <p className="text-sm" style={{ color: "oklch(70% 0.010 280.0)" }}>
            Innovation Scouting Platform
          </p>
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: "var(--card)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-display">
              {needsSetup ? "Create Analyst Account" : "Analyst Sign In"}
            </CardTitle>
            <CardDescription>
              {needsSetup
                ? "Set up the shared analyst credentials for your team."
                : "Sign in to access the scouting workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="analyst"
                    className="pl-9"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                    autoComplete={needsSetup ? "new-password" : "current-password"}
                  />
                </div>
              </div>

              {needsSetup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold"
                style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}
                disabled={login.isPending || setup.isPending}
              >
                {(login.isPending || setup.isPending) && <Loader2 className="animate-spin mr-2" size={16} />}
                {needsSetup ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs" style={{ color: "oklch(50% 0.010 280.0)" }}>
          VCL studio · Innovation Scouting Platform · Confidential
        </p>
      </div>
    </div>
  );
}
