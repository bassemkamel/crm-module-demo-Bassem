import { PipelineStage } from '@prisma/client';

export interface StageBreakdown {
  stage: PipelineStage;
  count: number;
  value: number;
}

export interface PipelineSummary {
  /** Total number of opportunities. */
  totalCount: number;
  /** Sum of amounts for non-terminal (open) opportunities. */
  totalOpenValue: number;
  /** Open value weighted by each stage's win probability. */
  weightedOpenValue: number;
  /** Sum of amounts for WON opportunities. */
  wonValue: number;
  /** Sum of amounts for LOST opportunities. */
  lostValue: number;
  /** Count and value of problematic (late or stagnant) opportunities. */
  problematic: { count: number; value: number };
  /** Per-stage count and value (all stages, including empty ones). */
  byStage: StageBreakdown[];
}

/** Rough win probability per stage, used for the weighted pipeline value. */
export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  NEW: 0.1,
  QUALIFIED: 0.25,
  PROPOSAL: 0.5,
  NEGOTIATION: 0.75,
  WON: 1,
  LOST: 0,
};
