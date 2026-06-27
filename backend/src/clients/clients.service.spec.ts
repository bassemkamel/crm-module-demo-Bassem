import { NotFoundException } from '@nestjs/common';
import { ClientType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let prisma: {
    client: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: ClientsService;

  const clientRow = {
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

  beforeEach(() => {
    prisma = {
      client: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new ClientsService(prisma as unknown as PrismaService);
  });

  describe('findOne', () => {
    it('returns the client when it exists', async () => {
      prisma.client.findUnique.mockResolvedValue(clientRow);

      const result = await service.findOne('client-1');

      expect(result.id).toBe('client-1');
      expect(result.displayName).toBe('Acme');
    });

    it('throws NotFoundException when the client is missing', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('missing')).rejects.toMatchObject({
        status: 404,
        message: 'Client missing not found',
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the client is missing', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the client is missing', async () => {
      prisma.client.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
