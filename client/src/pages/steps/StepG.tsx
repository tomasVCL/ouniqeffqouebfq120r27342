import { EvaluationMatrix } from "./MatrixBase";

interface Props { projectId: number; }

const PUGH_OPTIONS = [
  { value: -1, label: "Worse than baseline",  color: "oklch(55.0% 0.200 25.0)" },
  { value: 0,  label: "Same as baseline",     color: "oklch(60.0% 0.010 280.0)" },
  { value: 1,  label: "Better than baseline", color: "oklch(60.0% 0.140 145.0)" },
];

function getScoreColor(v: number | null): string {
  if (v === null) return "var(--muted-foreground)";
  if (v < 0) return "oklch(55.0% 0.200 25.0)";
  if (v === 0) return "oklch(60.0% 0.010 280.0)";
  return "oklch(60.0% 0.140 145.0)";
}

export default function StepG({ projectId }: Props) {
  return (
    <EvaluationMatrix
      projectId={projectId}
      matrixType="pugh"
      title="Step G · Pugh Concept Selection Matrix"
      description="Compare each startup against a baseline reference using +1 (better), 0 (same), or -1 (worse) scores."
      scoreOptions={PUGH_OPTIONS}
      getScoreLabel={v => v === null ? "-" : v > 0 ? `+${v}` : String(v)}
      getScoreColor={getScoreColor}
    />
  );
}
