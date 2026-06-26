import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientResponse, toClientResponse } from './client.mapper';
import { CreateClientDto } from './dto/create-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto): Promise<ClientResponse> {
    const client = await this.prisma.client.create({ data: dto });
    return toClientResponse(client);
  }

  async findAll(query: QueryClientsDto): Promise<ClientResponse[]> {
    const where: Prisma.ClientWhereInput = {};
    if (query.type) {
      where.type = query.type;
    }

    const clients = await this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return clients.map(toClientResponse);
  }

  async findOne(id: string): Promise<ClientResponse> {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    return toClientResponse(client);
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientResponse> {
    await this.findOne(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
    });
    return toClientResponse(client);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.delete({ where: { id } });
  }
}
