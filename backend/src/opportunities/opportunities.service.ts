import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PipelineStage, Prisma } from '@prisma/client';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  Paginated,
} from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { QueryOpportunitiesDto } from './dto/query-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { buildProblematicWhere } from './opportunity.filters';
import {
  OpportunityResponse,
  toOpportunityResponse,
} from './opportunity.mapper';
import {
  PipelineSummary,
  STAGE_PROBABILITY,
  StageBreakdown,
} from './opportunity.summary';

const TERMINAL_STAGES: ReadonlySet<PipelineStage> = new Set([
  PipelineStage.WON,
  PipelineStage.LOST,
]);

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOpportunityDto): Promise<OpportunityResponse> {
    await this.assertClientExists(dto.clientId);

    const opportunity = await this.prisma.opportunity.create({
      data: {
        title: dto.title,
        amount: new Prisma.Decimal(dto.amount),
        expectedCloseDate: new Date(dto.expectedCloseDate),
        stage: dto.stage,
        clientId: dto.clientId,
      },
      include: { client: true },
    });

    return toOpportunityResponse(opportunity);
  }

  async findAll(
    query: QueryOpportunitiesDto,
  ): Promise<Paginated<OpportunityResponse>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const now = new Date();

    const and: Prisma.OpportunityWhereInput[] = [];
    if (query.stage) {
      and.push({ stage: query.stage });
    }
    if (query.clientType) {
      and.push({ client: { type: query.clientType } });
    }
    if (query.problematic === true) {
      and.push(buildProblematicWhere(now));
    } else if (query.problematic === false) {
      and.push({ NOT: buildProblematicWhere(now) });
    }
    const where: Prisma.OpportunityWhereInput = and.length ? { AND: and } : {};

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((o) => toOpportunityResponse(o, now)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPipelineSummary(): Promise<PipelineSummary> {
    const now = new Date();

    const grouped = await this.prisma.opportunity.groupBy({
      by: ['stage'],
      _sum: { amount: true },
      _count: { _all: true },
    });

    const stats = new Map<PipelineStage, { count: number; value: number }>();
    for (const row of grouped) {
      stats.set(row.stage, {
        count: row._count._all,
        value: Number(row._sum.amount ?? 0),
      });
    }

    const byStage: StageBreakdown[] = Object.values(PipelineStage).map(
      (stage) => ({
        stage,
        count: stats.get(stage)?.count ?? 0,
        value: stats.get(stage)?.value ?? 0,
      }),
    );

    let totalCount = 0;
    let totalOpenValue = 0;
    let weightedOpenValue = 0;
    for (const entry of byStage) {
      totalCount += entry.count;
      if (!TERMINAL_STAGES.has(entry.stage)) {
        totalOpenValue += entry.value;
        weightedOpenValue += entry.value * STAGE_PROBABILITY[entry.stage];
      }
    }

    const problematic = await this.prisma.opportunity.aggregate({
      where: buildProblematicWhere(now),
      _sum: { amount: true },
      _count: { _all: true },
    });

    return {
      totalCount,
      totalOpenValue: round2(totalOpenValue),
      weightedOpenValue: round2(weightedOpenValue),
      wonValue: stats.get(PipelineStage.WON)?.value ?? 0,
      lostValue: stats.get(PipelineStage.LOST)?.value ?? 0,
      problematic: {
        count: problematic._count._all,
        value: Number(problematic._sum.amount ?? 0),
      },
      byStage,
    };
  }

  async findOne(id: string): Promise<OpportunityResponse> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }
    return toOpportunityResponse(opportunity);
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunityResponse> {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }

    if (dto.clientId) {
      await this.assertClientExists(dto.clientId);
    }

    const data: Prisma.OpportunityUncheckedUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.expectedCloseDate !== undefined) {
      data.expectedCloseDate = new Date(dto.expectedCloseDate);
    }
    if (dto.clientId !== undefined) data.clientId = dto.clientId;

    // Track stage transitions so we can detect stagnation.
    if (dto.stage !== undefined && dto.stage !== existing.stage) {
      data.stage = dto.stage;
      data.stageChangedAt = new Date();
    }

    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data,
      include: { client: true },
    });

    return toOpportunityResponse(opportunity);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Opportunity ${id} not found`);
    }
    await this.prisma.opportunity.delete({ where: { id } });
  }

  private async assertClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new BadRequestException(`Client ${clientId} does not exist`);
    }
  }
}
