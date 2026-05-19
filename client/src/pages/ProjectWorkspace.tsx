import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import AnalystLayout from "@/components/AnalystLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import StepA from "./steps/StepA";
import StepB from "./steps/StepB";
import StepC from "./steps/StepC";
import StepD from "./steps/StepD";
import StepE from "./steps/StepE";
import StepF from "./steps/StepF";
import StepG from "./steps/StepG";
import StepH from "./steps/StepH";
import StepI from "./steps/StepI";
import StepJ from "./steps/StepJ";
import StepK from "./steps/StepK";
import StepL from "./steps/StepL";

const STEPS = [
  { id: "A", label: "Project Setup",      short: "Setup" },
  { id: "B", label: "Requirements",       short: "Reqs" },
  { id: "C", label: "Formula Library",    short: "Formulas" },
  { id: "D", label: "Startup Universe",   short: "Startups" },
  { id: "E", label: "Strategic Clusters", short: "Clusters" },
  { id: "F", label: "WSM Matrix",         short: "WSM" },
  { id: "G", label: "Pugh Matrix",        short: "Pugh" },
  { id: "H", label: "Capability Fit",     short: "CapFit" },
  { id: "I", label: "Composite Matrix",   short: "Composite" },
  { id: "J", label: "Rankings & Tiers",   short: "Rankings" },
  { id: "K", label: "Recommendations",    short: "Recs" },
  { id: "L", label: "Publish Report",     short: "Publish" },
];

export default function ProjectWorkspace() {
  const params = useParams<{ id: string; step: string }>();
  const [, navigate] = useLocation();
  const projectId = parseInt(params.id, 10);
  const currentStepId = (params.step || "A").toUpperCase();
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStepId);

  const { data: project, isLoading } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: !isNaN(projectId) }
  );

  const goToStep = (stepId: string) => navigate(`/analyst/projects/${projectId}/step/${stepId}`);
  const prevStep = currentStepIndex > 0 ? STEPS[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < STEPS.length - 1 ? STEPS[currentStepIndex + 1] : null;

  if (isNaN(projectId)) return <div className="p-8 text-center text-muted-foreground">Invalid project ID</div>;

  if (isLoading) {
    return (
      <AnalystLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" style={{ color: "oklch(62.8% 0.218 38.4)" }} size={32} />
        </div>
      </AnalystLayout>
    );
  }

  if (!project) {
    return (
      <AnalystLayout>
        <div className="p-8 text-center text-muted-foreground">Project not found</div>
      </AnalystLayout>
    );
  }

  const renderStep = () => {
    const props = { projectId };
    switch (currentStepId) {
      case "A": return <StepA {...props} />;
      case "B": return <StepB {...props} />;
      case "C": return <StepC {...props} />;
      case "D": return <StepD {...props} />;
      case "E": return <StepE {...props} />;
      case "F": return <StepF {...props} />;
      case "G": return <StepG {...props} />;
      case "H": return <StepH {...props} />;
      case "I": return <StepI {...props} />;
      case "J": return <StepJ {...props} />;
      case "K": return <StepK {...props} />;
      case "L": return <StepL {...props} />;
      default:  return <div className="p-8 text-muted-foreground">Unknown step</div>;
    }
  };

  return (
    <AnalystLayout projectTitle={project.title} projectId={projectId} currentStep={currentStepIndex + 1} totalSteps={STEPS.length}>
      <div className="flex flex-col h-full">
        {/* Step progress bar */}
        <div className="border-b px-4 py-3 overflow-x-auto" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1 min-w-max">
            {STEPS.map((step, idx) => {
              const active = step.id === currentStepId;
              const done = idx < currentStepIndex;
              return (
                <button key={step.id} onClick={() => goToStep(step.id)} className="flex items-center gap-1.5 group">
                  <div className={cn("step-dot text-xs", active ? "active" : done ? "done" : "inactive")}>{step.id}</div>
                  <span className={cn("text-xs font-medium hidden sm:block transition-colors", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{step.short}</span>
                  {idx < STEPS.length - 1 && <div className="w-4 h-px mx-1" style={{ background: done ? "oklch(62.8% 0.218 38.4 / 0.4)" : "var(--border)" }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto">{renderStep()}</div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <Button variant="outline" size="sm" onClick={() => prevStep && goToStep(prevStep.id)} disabled={!prevStep}>
            <ChevronLeft size={16} className="mr-1" />{prevStep?.label || "Back"}
          </Button>
          <span className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {STEPS.length} · {STEPS[currentStepIndex]?.label}</span>
          <Button size="sm" onClick={() => nextStep && goToStep(nextStep.id)} disabled={!nextStep} style={{ background: "oklch(62.8% 0.218 38.4)", color: "white" }}>
            {nextStep?.label || "Next"}<ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    </AnalystLayout>
  );
}
