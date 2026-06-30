import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';
import { NormalizedOAuthProfile } from '../types/oauth-profile.type';
import { getOAuthProfile } from './oauth-http';

type NaverProfile = {
  resultcode: string;
  message: string;
  response: {
    id: string;
    email: string;
    name?: string;
    nickname?: string;
  };
};

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://nid.naver.com/oauth2.0/authorize',
      tokenURL: 'https://nid.naver.com/oauth2.0/token',
      clientID:
        configService.get<string>('NAVER_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('NAVER_CLIENT_SECRET') || 'not-configured',
      callbackURL: `${configService.get<string>(
        'API_BASE_URL',
        'http://localhost:8000',
      )}/auth/oauth/naver/callback`,
    });
  }

  userProfile(
    accessToken: string,
    done: (error: Error | null, profile?: NaverProfile) => void,
  ) {
    getOAuthProfile<NaverProfile>(
      'https://openapi.naver.com/v1/nid/me',
      accessToken,
    ).then((profile) => done(null, profile), done);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: NaverProfile,
  ): NormalizedOAuthProfile {
    return {
      provider: OAuthProvider.NAVER,
      providerId: profile.response.id,
      email: profile.response.email,
      emailVerified: true,
      displayName: profile.response.name || profile.response.nickname,
    };
  }
}
