import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createMockHost(url = '/api/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request = { url };
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status, json }),
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json, request };
}

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('mock', {
    code,
    clientVersion: '6.0.0',
  });
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('maps NestJS HttpException to its status code', () => {
    const { host, status, json } = createMockHost('/api/clients/x');

    filter.catch(new NotFoundException('Client x not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Client x not found',
        path: '/api/clients/x',
        timestamp: expect.any(String),
      }),
    );
  });

  it('maps validation-style BadRequestException with message array', () => {
    const { host, status, json } = createMockHost();

    filter.catch(
      new BadRequestException({
        message: ['email must be an email'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['email must be an email'],
        error: 'Bad Request',
      }),
    );
  });

  it('maps UnauthorizedException to 401', () => {
    const { host, status } = createMockHost('/api/auth/login');

    filter.catch(new UnauthorizedException('Invalid email or password'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });

  it('maps Prisma P2025 to 404', () => {
    const { host, status, json } = createMockHost();

    filter.catch(prismaError('P2025'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      }),
    );
  });

  it('maps Prisma P2002 to 409', () => {
    const { host, status, json } = createMockHost();

    filter.catch(prismaError('P2002'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Unique constraint violation',
        error: 'Conflict',
      }),
    );
  });

  it('maps Prisma P2003 to 400', () => {
    const { host, status, json } = createMockHost();

    filter.catch(prismaError('P2003'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related record does not exist',
        error: 'Bad Request',
      }),
    );
  });

  it('maps unknown Prisma errors to 400', () => {
    const { host, status, json } = createMockHost();

    filter.catch(prismaError('P9999'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Database error (P9999)',
      }),
    );
  });

  it('maps unknown errors to 500', () => {
    const { host, status, json } = createMockHost();

    filter.catch(new Error('unexpected'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      }),
    );
  });
});
