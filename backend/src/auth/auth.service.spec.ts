import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let users: { findByEmail: jest.Mock };
  let jwt: { signAsync: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    users = { findByEmail: jest.fn() };
    jwt = { signAsync: jest.fn().mockResolvedValue('token') };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );
    jest.mocked(bcrypt.compare).mockReset();
  });

  it('returns a token for valid credentials', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@crm.local',
      passwordHash: 'hash',
      name: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(true);

    const result = await service.login({
      email: 'admin@crm.local',
      password: 'admin1234',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.email).toBe('admin@crm.local');
  });

  it('throws UnauthorizedException for unknown email', async () => {
    users.findByEmail.mockResolvedValue(null);
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      service.login({ email: 'unknown@crm.local', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      service.login({ email: 'unknown@crm.local', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('throws UnauthorizedException for wrong password', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'admin@crm.local',
      passwordHash: 'hash',
      name: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jest.mocked(bcrypt.compare).mockResolvedValue(false);

    await expect(
      service.login({ email: 'admin@crm.local', password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
