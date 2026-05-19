import { EvaluationMatrix } from "./MatrixBase";

interface Props { projectId: number; }

const WSM_OPTIONS = [
  { value: 0,  label: "Does not meet",    color: "oklch(55.0% 0.200 25.0)" },
  { value: 1,  label: "Partially meets",  color: "oklch(78.5% 0.175 75.0)" },
  { value: 2,  label: "Meets",            color: "oklch(70.0% 0.160 145.0)" },
  { value: 3,  label: "Exceeds",          color: "oklch(60.0% 0.180 145.0)" },
  { value: 4,  label: "Far exceeds",      color: "oklch(50.0% 0.200 145.0)" },
  { value: 5,  label: "Exceptional",      color: "oklch(40.0% 0.200 145.0)" },
  { value: 6,  label: "Outstanding",      color: "oklch(35.0% 0.200 145.0)" },
  { value: 7,  label: "Best-in-class",    color: "oklch(30.0% 0.180 145.0)" },
  { value: 8,  label: "Industry leader",  color: "oklch(25.0% 0.160 145.0)" },
  { value: 9,  label: "Transformative",   color: "oklch(20.0% 0.140 145.0)" },
  { value: 10, label: "Perfect fit",      color: "oklch(15.0% 0.120 145.0)" },
];

function getScoreColor(v: number | null): string {
  if (v === null) return "var(--muted-foreground)";
  if (v <= 2) return "oklch(55.0% 0.200 25.0)";
  if (v <= 4) return "oklch(78.5% 0.175 75.0)";
  if (v <= 6) return "oklch(62.0% 0.140 145.0)";
  return "oklch(42.0% 0.180 145.0)";
}

export default function StepF({ projectId }: Props) {
  return (
    <EvaluationMatrix
      projectId={projectId}
      matrixType="wsm"
      title="Step F · WSM Evaluation Matrix"
      description="Score each startup against each requirement on a 0–10 scale. Scores are weighted by requirement importance."
      scoreOptions={WSM_OPTIONS.filter((_, i) => i % 2 === 0 || [0,1,5,10].includes(WSM_OPTIONS[i].value))}
      getScoreLabel={v => v === null ? "-" : String(v)}
      getScoreColor={getScoreColor}
    />
  );
}
