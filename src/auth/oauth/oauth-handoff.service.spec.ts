import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { OAuthHandoffService } from './oauth-handoff.service';

describe('OAuthHandoffService', () => {
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
  };

  let values: Map<string, string>;
  let redisClient: {
    set: jest.Mock;
    eval: jest.Mock;
  };
  let service: OAuthHandoffService;

  beforeEach(() => {
    values = new Map();
    redisClient = {
      set: jest.fn(async (key: string, value: string) => {
        values.set(key, value);
        return 'OK';
      }),
      eval: jest.fn(async (_script: string, _keyCount: number, key: string) => {
        const value = values.get(key) ?? null;
        values.delete(key);
        return value;
      }),
    };

    service = new OAuthHandoffService(
      { client: redisClient } as unknown as RedisService,
      {
        get: jest.fn((_key: string, fallback: string) => fallback),
      } as unknown as ConfigService,
    );
  });

  it('stores tokens behind an opaque short-lived code', async () => {
    const code = await service.create(tokens);

    expect(code).not.toContain(tokens.accessToken);
    expect(redisClient.set).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:oauth-handoff:[a-f0-9]{64}$/),
      JSON.stringify(tokens),
      'EX',
      60,
    );
  });

  it('allows a handoff code to be consumed only once', async () => {
    const code = await service.create(tokens);

    await expect(service.consume(code)).resolves.toEqual(tokens);
    await expect(service.consume(code)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
