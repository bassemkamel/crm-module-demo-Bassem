import {
  HEALTH_BADGE_CLASSES,
  HEALTH_LABELS,
  STAGE_BADGE_CLASSES,
  STAGE_LABELS,
} from "@/lib/format";
import type { OpportunityHealth, PipelineStage } from "@/lib/types";

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span className={`${base} ${STAGE_BADGE_CLASSES[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function HealthBadge({ health }: { health: OpportunityHealth }) {
  return (
    <span className={`${base} ${HEALTH_BADGE_CLASSES[health]}`}>
      {HEALTH_LABELS[health]}
    </span>
  );
}
