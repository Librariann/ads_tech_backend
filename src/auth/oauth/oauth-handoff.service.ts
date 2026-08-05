import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { RedisService } from '../../redis/redis.service';

type OAuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
};

@Injectable()
export class OAuthHandoffService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = Number(
      configService.get<string>('OAUTH_HANDOFF_TTL_SECONDS', '60'),
    );

    if (!Number.isInteger(this.ttlSeconds) || this.ttlSeconds <= 0) {
      throw new Error('Invalid OAUTH_HANDOFF_TTL_SECONDS');
    }
  }

  async create(tokens: OAuthTokens) {
    const code = randomBytes(32).toString('base64url');

    try {
      await this.redisService.client.set(
        this.key(code),
        JSON.stringify(tokens),
        'EX',
        this.ttlSeconds,
      );
    } catch {
      throw new ServiceUnavailableException(
        'OAuth handoff store is unavailable',
      );
    }

    return code;
  }

  async consume(code: string): Promise<OAuthTokens> {
    let value: unknown;

    try {
      value = await this.redisService.client.eval(
        `
          local value = redis.call('GET', KEYS[1])
          if not value then return nil end
          redis.call('DEL', KEYS[1])
          return value
        `,
        1,
        this.key(code),
      );
    } catch {
      throw new ServiceUnavailableException(
        'OAuth handoff store is unavailable',
      );
    }

    if (typeof value !== 'string') {
      throw new UnauthorizedException('Invalid or expired OAuth handoff code');
    }

    try {
      const tokens = JSON.parse(value) as Partial<OAuthTokens>;
      if (
        typeof tokens.accessToken !== 'string' ||
        typeof tokens.refreshToken !== 'string' ||
        typeof tokens.tokenType !== 'string'
      ) {
        throw new Error('Invalid OAuth handoff payload');
      }
      return tokens as OAuthTokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth handoff code');
    }
  }

  private key(code: string) {
    const digest = createHash('sha256').update(code).digest('hex');
    return `auth:oauth-handoff:${digest}`;
  }
}
