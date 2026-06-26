import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import {
  OpportunityResponse,
  toOpportunityResponse,
} from './opportunity.mapper';

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

  async findAll(): Promise<OpportunityResponse[]> {
    const opportunities = await this.prisma.opportunity.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return opportunities.map((o) => toOpportunityResponse(o, now));
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
