import { PipelineStage } from '@prisma/client';
import {
  computeHealth,
  getStagnantThresholdDays,
  isProblematic,
  OpportunityHealth,
} from './opportunity.health';

describe('computeHealth', () => {
  // Fixed "now" so the tests are deterministic.
  const now = new Date(2026, 5, 15, 12, 0, 0); // 15 June 2026
  const threshold = 14;

  const future = new Date(2026, 6, 1); // 1 July 2026
  const past = new Date(2026, 5, 10); // 10 June 2026
  const recentStageChange = new Date(2026, 5, 12); // 3 days ago

  it('returns OK for a fresh, on-time opportunity', () => {
    expect(
      computeHealth(
        {
          stage: PipelineStage.PROPOSAL,
          expectedCloseDate: future,
          stageChangedAt: recentStageChange,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.OK);
  });

  it('returns LATE when the expected close date has passed', () => {
    expect(
      computeHealth(
        {
          stage: PipelineStage.NEGOTIATION,
          expectedCloseDate: past,
          stageChangedAt: recentStageChange,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.LATE);
  });

  it('returns STAGNANT when stage has not changed within the threshold', () => {
    const oldStageChange = new Date(2026, 4, 1); // 1 May 2026 (>14 days)
    expect(
      computeHealth(
        {
          stage: PipelineStage.QUALIFIED,
          expectedCloseDate: future,
          stageChangedAt: oldStageChange,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.STAGNANT);
  });

  it('prioritises LATE over STAGNANT when both apply', () => {
    const oldStageChange = new Date(2026, 4, 1);
    expect(
      computeHealth(
        {
          stage: PipelineStage.NEW,
          expectedCloseDate: past,
          stageChangedAt: oldStageChange,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.LATE);
  });

  it.each([PipelineStage.WON, PipelineStage.LOST])(
    'returns OK for terminal stage %s regardless of dates',
    (stage) => {
      const oldStageChange = new Date(2026, 4, 1);
      expect(
        computeHealth(
          { stage, expectedCloseDate: past, stageChangedAt: oldStageChange },
          now,
          threshold,
        ),
      ).toBe(OpportunityHealth.OK);
    },
  );

  it('treats exactly-threshold days as not yet stagnant (boundary)', () => {
    const exactly = new Date(now.getTime() - threshold * 24 * 60 * 60 * 1000);
    expect(
      computeHealth(
        {
          stage: PipelineStage.NEW,
          expectedCloseDate: future,
          stageChangedAt: exactly,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.OK);

    const justOver = new Date(
      now.getTime() - (threshold + 1) * 24 * 60 * 60 * 1000,
    );
    expect(
      computeHealth(
        {
          stage: PipelineStage.NEW,
          expectedCloseDate: future,
          stageChangedAt: justOver,
        },
        now,
        threshold,
      ),
    ).toBe(OpportunityHealth.STAGNANT);
  });
});

describe('isProblematic', () => {
  it('is false only for OK', () => {
    expect(isProblematic(OpportunityHealth.OK)).toBe(false);
    expect(isProblematic(OpportunityHealth.LATE)).toBe(true);
    expect(isProblematic(OpportunityHealth.STAGNANT)).toBe(true);
  });
});

describe('getStagnantThresholdDays', () => {
  const original = process.env.STAGNANT_THRESHOLD_DAYS;

  afterEach(() => {
    process.env.STAGNANT_THRESHOLD_DAYS = original;
  });

  it('reads a valid value from the environment', () => {
    process.env.STAGNANT_THRESHOLD_DAYS = '30';
    expect(getStagnantThresholdDays()).toBe(30);
  });

  it('falls back to the default when unset or invalid', () => {
    delete process.env.STAGNANT_THRESHOLD_DAYS;
    expect(getStagnantThresholdDays()).toBe(14);

    process.env.STAGNANT_THRESHOLD_DAYS = 'not-a-number';
    expect(getStagnantThresholdDays()).toBe(14);
  });
});
