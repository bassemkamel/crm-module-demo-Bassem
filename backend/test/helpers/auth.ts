import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../src/prisma/prisma.service';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@crm.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin1234';

export async function ensureAdminUser(prisma: PrismaService): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, passwordHash, name: 'Admin' },
  });
}

export function adminCredentials() {
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
}

export async function login(
  server: Parameters<typeof request>[0],
): Promise<string> {
  const { email, password } = adminCredentials();
  const res = await request(server)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.accessToken as string;
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
