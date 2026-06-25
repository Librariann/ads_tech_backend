import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { RedisService } from '../redis/redis.service';

type SessionRecord = {
  userId: string;
  email: string;
  refreshTokenHash: string;
  createdAt: string;
};

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = this.parseDuration(
      configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '30d'),
    );
  }

  async ensureAvailable() {
    try {
      await this.redisService.client.ping();
    } catch {
      throw new ServiceUnavailableException(
        'Authentication session store is unavailable',
      );
    }
  }

  async create(userId: string, email: string) {
    const sessionId = randomUUID();
    const refreshSecret = randomBytes(48).toString('base64url');
    const refreshToken = `${sessionId}.${refreshSecret}`;
    const session: SessionRecord = {
      userId,
      email,
      refreshTokenHash: this.hash(refreshToken),
      createdAt: new Date().toISOString(),
    };

    await this.redisService.client
      .multi()
      .set(
        this.sessionKey(sessionId),
        JSON.stringify(session),
        'EX',
        this.ttlSeconds,
      )
      .sadd(this.userSessionsKey(userId), sessionId)
      .expire(this.userSessionsKey(userId), this.ttlSeconds)
      .exec();

    return { sessionId, refreshToken };
  }

  async rotate(refreshToken: string) {
    const sessionId = this.getSessionId(refreshToken);
    const session = await this.get(sessionId);
    const currentHash = this.hash(refreshToken);

    if (!session || !this.matches(currentHash, session.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshSecret = randomBytes(48).toString('base64url');
    const nextRefreshToken = `${sessionId}.${refreshSecret}`;
    const nextHash = this.hash(nextRefreshToken);
    const rotated = await this.redisService.client.eval(
      `
        local raw = redis.call('GET', KEYS[1])
        if not raw then return 0 end
        local session = cjson.decode(raw)
        if session.refreshTokenHash ~= ARGV[1] then return 0 end
        session.refreshTokenHash = ARGV[2]
        redis.call('SET', KEYS[1], cjson.encode(session), 'EX', ARGV[3])
        return 1
      `,
      1,
      this.sessionKey(sessionId),
      currentHash,
      nextHash,
      this.ttlSeconds,
    );

    if (rotated !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.redisService.client.expire(
      this.userSessionsKey(session.userId),
      this.ttlSeconds,
    );

    return {
      sessionId,
      refreshToken: nextRefreshToken,
      userId: session.userId,
      email: session.email,
    };
  }

  async exists(sessionId: string) {
    return (
      (await this.redisService.client.exists(this.sessionKey(sessionId))) === 1
    );
  }

  async revoke(sessionId: string) {
    const session = await this.get(sessionId);
    if (!session) {
      return;
    }

    await this.redisService.client
      .multi()
      .del(this.sessionKey(sessionId))
      .srem(this.userSessionsKey(session.userId), sessionId)
      .exec();
  }

  async revokeAll(userId: string) {
    const indexKey = this.userSessionsKey(userId);
    const sessionIds = await this.redisService.client.smembers(indexKey);
    const pipeline = this.redisService.client.multi();

    for (const sessionId of sessionIds) {
      pipeline.del(this.sessionKey(sessionId));
    }
    pipeline.del(indexKey);
    await pipeline.exec();
  }

  private async get(sessionId: string) {
    const value = await this.redisService.client.get(
      this.sessionKey(sessionId),
    );
    return value ? (JSON.parse(value) as SessionRecord) : null;
  }

  private getSessionId(refreshToken: string) {
    const [sessionId, secret, ...rest] = refreshToken.split('.');
    if (!sessionId || !secret || rest.length > 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return sessionId;
  }

  private matches(actualHash: string, expectedHash: string) {
    const actual = Buffer.from(actualHash);
    const expected = Buffer.from(expectedHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private sessionKey(sessionId: string) {
    return `auth:session:${sessionId}`;
  }

  private userSessionsKey(userId: string) {
    return `auth:user:${userId}:sessions`;
  }

  private parseDuration(value: string) {
    const match = /^(\d+)([smhd])?$/.exec(value);
    if (!match) {
      throw new Error(`Invalid REFRESH_TOKEN_EXPIRES_IN: ${value}`);
    }

    const amount = Number(match[1]);
    const unitSeconds = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return amount * unitSeconds[match[2] || 's'];
  }
}
