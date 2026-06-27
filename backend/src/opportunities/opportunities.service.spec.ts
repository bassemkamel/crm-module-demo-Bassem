import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClientType, PipelineStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OpportunitiesService } from './opportunities.service';

interface PrismaMock {
  opportunity: {
    groupBy: jest.Mock;
    aggregate: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  client: { findUnique: jest.Mock };
  $transaction: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  return {
    opportunity: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
}

const sampleClient = {
  id: 'client-1',
  type: ClientType.COMPANY,
  email: 'contact@acme.example',
  phone: null,
  notes: null,
  companyName: 'Acme',
  registrationNumber: null,
  industry: null,
  firstName: null,
  lastName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OpportunitiesService', () => {
  let prisma: PrismaMock;
  let service: OpportunitiesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new OpportunitiesService(prisma as unknown as PrismaService);
  });

  describe('getPipelineSummary', () => {
    it('aggregates totals, weighted value and per-stage breakdown', async () => {
      prisma.opportunity.groupBy.mockResolvedValue([
        { stage: PipelineStage.NEW, _count: { _all: 1 }, _sum: { amount: 1000 } },
        {
          stage: PipelineStage.PROPOSAL,
          _count: { _all: 1 },
          _sum: { amount: 2000 },
        },
        {
          stage: PipelineStage.NEGOTIATION,
          _count: { _all: 1 },
          _sum: { amount: 500 },
        },
        { stage: PipelineStage.WON, _count: { _all: 1 }, _sum: { amount: 3000 } },
        { stage: PipelineStage.LOST, _count: { _all: 1 }, _sum: { amount: 800 } },
      ]);
      prisma.opportunity.aggregate.mockResolvedValue({
        _count: { _all: 1 },
        _sum: { amount: 1000 },
      });

      const summary = await service.getPipelineSummary();

      expect(summary.totalCount).toBe(5);
      // open = NEW + PROPOSAL + NEGOTIATION
      expect(summary.totalOpenValue).toBe(3500);
      // weighted = 1000*0.1 + 2000*0.5 + 500*0.75
      expect(summary.weightedOpenValue).toBe(1475);
      expect(summary.wonValue).toBe(3000);
      expect(summary.lostValue).toBe(800);
      expect(summary.problematic).toEqual({ count: 1, value: 1000 });
      expect(summary.byStage).toHaveLength(6);
      const qualified = summary.byStage.find(
        (s) => s.stage === PipelineStage.QUALIFIED,
      );
      expect(qualified).toEqual({
        stage: PipelineStage.QUALIFIED,
        count: 0,
        value: 0,
      });
    });
  });

  describe('update', () => {
    const existing = {
      id: 'opp-1',
      title: 'Deal',
      amount: 1000,
      expectedCloseDate: new Date(),
      stage: PipelineStage.NEW,
      stageChangedAt: new Date('2026-01-01T00:00:00Z'),
      clientId: 'client-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    function mockUpdateReturn() {
      prisma.opportunity.update.mockResolvedValue({
        ...existing,
        client: sampleClient,
      });
    }

    it('sets stageChangedAt when the stage changes', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(existing);
      mockUpdateReturn();

      await service.update('opp-1', { stage: PipelineStage.QUALIFIED });

      const callArg = prisma.opportunity.update.mock.calls[0][0] as {
        data: { stage?: PipelineStage; stageChangedAt?: Date };
      };
      expect(callArg.data.stage).toBe(PipelineStage.QUALIFIED);
      expect(callArg.data.stageChangedAt).toBeInstanceOf(Date);
    });

    it('does not touch stageChangedAt when the stage is unchanged', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(existing);
      mockUpdateReturn();

      await service.update('opp-1', { title: 'Renamed' });

      const callArg = prisma.opportunity.update.mock.calls[0][0] as {
        data: { stageChangedAt?: Date; title?: string };
      };
      expect(callArg.data.stageChangedAt).toBeUndefined();
      expect(callArg.data.title).toBe('Renamed');
    });
  });

  describe('create', () => {
    it('throws BadRequestException when the client does not exist', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          title: 'Deal',
          amount: 1000,
          expectedCloseDate: '2026-12-31',
          clientId: 'missing-client',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create({
          title: 'Deal',
          amount: 1000,
          expectedCloseDate: '2026-12-31',
          clientId: 'missing-client',
        }),
      ).rejects.toMatchObject({
        status: 400,
        message: 'Client missing-client does not exist',
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the opportunity is missing', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the opportunity is missing', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { title: 'Renamed' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the opportunity is missing', async () => {
      prisma.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
