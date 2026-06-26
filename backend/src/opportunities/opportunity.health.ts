import { PipelineStage } from '@prisma/client';

/**
 * Health of an opportunity from a pipeline-hygiene perspective (see DECISIONS.md):
 * - OK:        nothing wrong (or the deal is already closed)
 * - LATE:      the expected close date has passed and the deal isn't closed
 * - STAGNANT:  the deal hasn't changed stage for longer than the threshold
 *
 * LATE takes precedence over STAGNANT when both apply.
 */
export const OpportunityHealth = {
  OK: 'OK',
  LATE: 'LATE',
  STAGNANT: 'STAGNANT',
} as const;

export type OpportunityHealth =
  (typeof OpportunityHealth)[keyof typeof OpportunityHealth];

const TERMINAL_STAGES: ReadonlySet<PipelineStage> = new Set([
  PipelineStage.WON,
  PipelineStage.LOST,
]);

const DEFAULT_STAGNANT_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Reads the stagnation threshold (in days) from the environment, with a fallback. */
export function getStagnantThresholdDays(): number {
  const parsed = Number(process.env.STAGNANT_THRESHOLD_DAYS);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_STAGNANT_THRESHOLD_DAYS;
}

function startOfDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export interface HealthInput {
  stage: PipelineStage;
  expectedCloseDate: Date;
  stageChangedAt: Date;
}

export function computeHealth(
  opportunity: HealthInput,
  now: Date = new Date(),
  thresholdDays: number = getStagnantThresholdDays(),
): OpportunityHealth {
  if (TERMINAL_STAGES.has(opportunity.stage)) {
    return OpportunityHealth.OK;
  }

  if (startOfDay(opportunity.expectedCloseDate) < startOfDay(now)) {
    return OpportunityHealth.LATE;
  }

  const daysSinceStageChange =
    (now.getTime() - opportunity.stageChangedAt.getTime()) / MS_PER_DAY;
  if (daysSinceStageChange > thresholdDays) {
    return OpportunityHealth.STAGNANT;
  }

  return OpportunityHealth.OK;
}

export function isProblematic(health: OpportunityHealth): boolean {
  return health !== OpportunityHealth.OK;
}
