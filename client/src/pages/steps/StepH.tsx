import { EvaluationMatrix } from "./MatrixBase";

interface Props { projectId: number; }

const CAPFIT_OPTIONS = [
  { value: 1, label: "Low fit",    color: "oklch(55.0% 0.200 25.0)" },
  { value: 2, label: "Medium fit", color: "oklch(78.5% 0.175 75.0)" },
  { value: 3, label: "High fit",   color: "oklch(60.0% 0.140 145.0)" },
];

function getScoreColor(v: number | null): string {
  if (v === null) return "var(--muted-foreground)";
  if (v === 1) return "oklch(55.0% 0.200 25.0)";
  if (v === 2) return "oklch(78.5% 0.175 75.0)";
  return "oklch(60.0% 0.140 145.0)";
}

export default function StepH({ projectId }: Props) {
  return (
    <EvaluationMatrix
      projectId={projectId}
      matrixType="capfit"
      title="Step H · Capability Fit Matrix"
      description="Assess how well each startup's capabilities align with client requirements: High (3), Medium (2), or Low (1)."
      scoreOptions={CAPFIT_OPTIONS}
      getScoreLabel={v => v === null ? "-" : v === 1 ? "Low" : v === 2 ? "Med" : "High"}
      getScoreColor={getScoreColor}
    />
  );
}
