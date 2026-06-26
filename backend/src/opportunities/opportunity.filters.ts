import { PipelineStage, Prisma } from '@prisma/client';
import { getStagnantThresholdDays } from './opportunity.health';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const TERMINAL_STAGES = [PipelineStage.WON, PipelineStage.LOST];

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Prisma `where` matching the same definition of "problematic" as
 * `computeHealth`: a non-terminal opportunity that is either past its expected
 * close date (LATE) or hasn't changed stage within the threshold (STAGNANT).
 * Kept at the DB level so pagination totals stay correct.
 */
export function buildProblematicWhere(
  now: Date = new Date(),
  thresholdDays: number = getStagnantThresholdDays(),
): Prisma.OpportunityWhereInput {
  const stagnantCutoff = new Date(now.getTime() - thresholdDays * MS_PER_DAY);
  return {
    stage: { notIn: TERMINAL_STAGES },
    OR: [
      { expectedCloseDate: { lt: startOfToday(now) } },
      { stageChangedAt: { lt: stagnantCutoff } },
    ],
  };
}
