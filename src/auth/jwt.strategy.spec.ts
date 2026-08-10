import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../database/entities/enums';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';
import { JwtPayload } from './types/jwt-payload.type';

describe('JwtStrategy', () => {
  const payload: JwtPayload = {
    sub: '42',
    email: 'owner@example.com',
    sid: 'session-id',
  };
  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const usersService = {
    findActiveById: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;
  const sessionService = {
    exists: jest.fn(),
  } as unknown as jest.Mocked<SessionService>;

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(configService, usersService, sessionService);
  });

  it('returns the authenticated user for an active session and user', async () => {
    sessionService.exists.mockResolvedValue(true);
    usersService.findActiveById.mockResolvedValue({
      id: payload.sub,
      email: payload.email,
      displayName: 'Owner',
      status: UserStatus.ACTIVE,
    } as never);

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: payload.sub,
      email: payload.email,
      displayName: 'Owner',
      sessionId: payload.sid,
    });
  });

  it('rejects a missing or revoked session', async () => {
    sessionService.exists.mockResolvedValue(false);

    await expect(strategy.validate(payload)).rejects.toThrow(
      new UnauthorizedException('Session expired or revoked'),
    );
    expect(usersService.findActiveById).not.toHaveBeenCalled();
  });

  it('rejects a suspended or deleted user', async () => {
    sessionService.exists.mockResolvedValue(true);
    usersService.findActiveById.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
