import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ClientType, PipelineStage } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { adminCredentials, authHeader, ensureAdminUser, login } from './helpers/auth';
import { createTestApp } from './helpers/create-test-app';

describe('API HTTP status codes (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await ensureAdminUser(prisma);
  });

  beforeEach(async () => {
    token = await login(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  describe('200 OK', () => {
    it('POST /api/auth/login with valid credentials', async () => {
      const { email, password } = adminCredentials();
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.email).toBe(email);
    });

    it('GET /api/auth/me with a valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set(authHeader(token))
        .expect(200);

      expect(res.body.email).toBe(adminCredentials().email);
    });

    it('GET /api/clients lists clients', async () => {
      await request(app.getHttpServer())
        .get('/api/clients')
        .set(authHeader(token))
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/clients/:id returns a client', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.INDIVIDUAL,
          firstName: 'Read',
          lastName: 'Test',
          email: `read-${Date.now()}@example.com`,
        },
      });

      await request(app.getHttpServer())
        .get(`/api/clients/${client.id}`)
        .set(authHeader(token))
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(client.id);
        });

      await prisma.client.delete({ where: { id: client.id } });
    });

    it('GET /api/opportunities/:id returns an opportunity', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.COMPANY,
          companyName: 'Read Opp Co',
          email: `read-opp-${Date.now()}@example.com`,
        },
      });
      const opportunity = await prisma.opportunity.create({
        data: {
          title: 'Readable deal',
          amount: 900,
          expectedCloseDate: new Date('2026-12-31'),
          clientId: client.id,
        },
      });

      await request(app.getHttpServer())
        .get(`/api/opportunities/${opportunity.id}`)
        .set(authHeader(token))
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(opportunity.id);
        });

      await prisma.opportunity.delete({ where: { id: opportunity.id } });
      await prisma.client.delete({ where: { id: client.id } });
    });

    it('GET /api/opportunities lists opportunities', async () => {
      await request(app.getHttpServer())
        .get('/api/opportunities')
        .set(authHeader(token))
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual(expect.any(Array));
          expect(res.body.meta).toEqual(expect.any(Object));
        });
    });

    it('GET /api/opportunities/pipeline/summary returns KPIs', async () => {
      await request(app.getHttpServer())
        .get('/api/opportunities/pipeline/summary')
        .set(authHeader(token))
        .expect(200)
        .expect((res) => {
          expect(res.body.totalOpenValue).toEqual(expect.any(Number));
          expect(res.body.byStage).toEqual(expect.any(Array));
        });
    });
  });

  describe('201 Created', () => {
    it('POST /api/clients creates a company', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/clients')
        .set(authHeader(token))
        .send({
          type: ClientType.COMPANY,
          companyName: 'Test Corp E2E',
          email: `test-corp-${Date.now()}@example.com`,
        })
        .expect(201);

      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.displayName).toBe('Test Corp E2E');

      await prisma.client.delete({ where: { id: res.body.id } });
    });

    it('POST /api/opportunities creates an opportunity', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.COMPANY,
          companyName: 'Opp Client E2E',
          email: `opp-client-${Date.now()}@example.com`,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/opportunities')
        .set(authHeader(token))
        .send({
          title: 'E2E deal',
          amount: 1500,
          expectedCloseDate: '2026-12-31',
          stage: PipelineStage.NEW,
          clientId: client.id,
        })
        .expect(201);

      expect(res.body.id).toEqual(expect.any(String));
      expect(res.body.clientId).toBe(client.id);

      await prisma.opportunity.delete({ where: { id: res.body.id } });
      await prisma.client.delete({ where: { id: client.id } });
    });
  });

  describe('204 No Content', () => {
    it('DELETE /api/opportunities/:id removes an opportunity', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.COMPANY,
          companyName: 'Delete Opp Client',
          email: `del-opp-${Date.now()}@example.com`,
        },
      });
      const opportunity = await prisma.opportunity.create({
        data: {
          title: 'To delete',
          amount: 500,
          expectedCloseDate: new Date('2026-12-31'),
          clientId: client.id,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/opportunities/${opportunity.id}`)
        .set(authHeader(token))
        .expect(204);

      await prisma.client.delete({ where: { id: client.id } });
    });

    it('DELETE /api/clients/:id removes a client', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.COMPANY,
          companyName: 'Delete Client E2E',
          email: `del-client-${Date.now()}@example.com`,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/clients/${client.id}`)
        .set(authHeader(token))
        .expect(204);
    });
  });

  describe('400 Bad Request', () => {
    it('POST /api/auth/login rejects invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'admin1234' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
        });
    });

    it('POST /api/clients rejects a company without companyName', async () => {
      await request(app.getHttpServer())
        .post('/api/clients')
        .set(authHeader(token))
        .send({
          type: ClientType.COMPANY,
          email: 'no-name@example.com',
        })
        .expect(400);
    });

    it('POST /api/clients rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/clients')
        .set(authHeader(token))
        .send({
          type: ClientType.COMPANY,
          companyName: 'Extra Field Co',
          email: 'extra@example.com',
          unknownField: true,
        })
        .expect(400);
    });

    it('POST /api/opportunities rejects a missing client', async () => {
      await request(app.getHttpServer())
        .post('/api/opportunities')
        .set(authHeader(token))
        .send({
          title: 'Orphan deal',
          amount: 1000,
          expectedCloseDate: '2026-12-31',
          clientId: 'non-existent-client-id',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('does not exist');
        });
    });

    it('POST /api/opportunities rejects invalid amount', async () => {
      const client = await prisma.client.create({
        data: {
          type: ClientType.INDIVIDUAL,
          firstName: 'Bad',
          lastName: 'Amount',
          email: `bad-amount-${Date.now()}@example.com`,
        },
      });

      await request(app.getHttpServer())
        .post('/api/opportunities')
        .set(authHeader(token))
        .send({
          title: 'Bad amount',
          amount: -100,
          expectedCloseDate: '2026-12-31',
          clientId: client.id,
        })
        .expect(400);

      await prisma.client.delete({ where: { id: client.id } });
    });
  });

  describe('401 Unauthorized', () => {
    it('GET /api/clients without a token', async () => {
      await request(app.getHttpServer()).get('/api/clients').expect(401);
    });

    it('GET /api/clients with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/clients')
        .set({ Authorization: 'Bearer invalid-token' })
        .expect(401);
    });

    it('POST /api/auth/login with wrong password', async () => {
      const { email } = adminCredentials();
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid email or password');
        });
    });
  });

  describe('404 Not Found', () => {
    it('GET /api/clients/:id for a missing client', async () => {
      await request(app.getHttpServer())
        .get('/api/clients/non-existent-id')
        .set(authHeader(token))
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });

    it('PATCH /api/clients/:id for a missing client', async () => {
      await request(app.getHttpServer())
        .patch('/api/clients/non-existent-id')
        .set(authHeader(token))
        .send({ phone: '+33 1 00 00 00 00' })
        .expect(404);
    });

    it('DELETE /api/clients/:id for a missing client', async () => {
      await request(app.getHttpServer())
        .delete('/api/clients/non-existent-id')
        .set(authHeader(token))
        .expect(404);
    });

    it('GET /api/opportunities/:id for a missing opportunity', async () => {
      await request(app.getHttpServer())
        .get('/api/opportunities/non-existent-id')
        .set(authHeader(token))
        .expect(404);
    });

    it('PATCH /api/opportunities/:id for a missing opportunity', async () => {
      await request(app.getHttpServer())
        .patch('/api/opportunities/non-existent-id')
        .set(authHeader(token))
        .send({ title: 'Ghost' })
        .expect(404);
    });

    it('DELETE /api/opportunities/:id for a missing opportunity', async () => {
      await request(app.getHttpServer())
        .delete('/api/opportunities/non-existent-id')
        .set(authHeader(token))
        .expect(404);
    });
  });
});
