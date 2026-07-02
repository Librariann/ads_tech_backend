import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';

type StatePayload = {
  provider: OAuthProvider;
  nonce: string;
  expiresAt: number;
};

@Injectable()
export class OAuthStateService {
  private readonly secret: string;
  private readonly secureCookie: boolean;

  constructor(private readonly configService: ConfigService) {
    this.secret = configService.get<string>(
      'OAUTH_STATE_SECRET',
      configService.get<string>('JWT_SECRET', 'dev-jwt-secret'),
    );
    this.secureCookie = configService.get<string>('NODE_ENV') === 'production';
  }

  create(response: Response, provider: OAuthProvider) {
    this.assertConfigured(provider);

    const payload: StatePayload = {
      provider,
      nonce: randomBytes(24).toString('base64url'),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const state = `${encoded}.${this.sign(encoded)}`;

    response.cookie(this.cookieName(provider), state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secureCookie,
      maxAge: 10 * 60 * 1000,
      path: `/auth/oauth/${provider}/callback`,
    });

    return state;
  }

  validate(request: Request, response: Response, provider: OAuthProvider) {
    const state =
      typeof request.query.state === 'string' ? request.query.state : '';
    const cookieState = this.readCookie(
      request.headers.cookie,
      this.cookieName(provider),
    );

    response.clearCookie(this.cookieName(provider), {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.secureCookie,
      path: `/auth/oauth/${provider}/callback`,
    });

    if (!state || !cookieState || !this.safeEqual(state, cookieState)) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const [encoded, signature, ...rest] = state.split('.');
    if (
      !encoded ||
      !signature ||
      rest.length > 0 ||
      !this.safeEqual(signature, this.sign(encoded))
    ) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as StatePayload;
      if (payload.provider !== provider || payload.expiresAt < Date.now()) {
        throw new UnauthorizedException('Expired OAuth state');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid OAuth state');
    }
  }

  private assertConfigured(provider: OAuthProvider) {
    const prefix = provider.toUpperCase();
    const hasClientId = this.configService.get<string>(`${prefix}_CLIENT_ID`);
    const hasRequiredSecret =
      provider === OAuthProvider.KAKAO ||
      this.configService.get<string>(`${prefix}_CLIENT_SECRET`);

    if (!hasClientId || !hasRequiredSecret) {
      throw new ServiceUnavailableException(
        `${prefix} OAuth credentials are not configured`,
      );
    }
  }

  private sign(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private cookieName(provider: OAuthProvider) {
    return `oauth_state_${provider}`;
  }

  private readCookie(cookieHeader: string | undefined, name: string) {
    if (!cookieHeader) {
      return undefined;
    }

    for (const cookie of cookieHeader.split(';')) {
      const [key, ...value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value.join('='));
      }
    }
    return undefined;
  }
}
