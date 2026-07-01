import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';
import { NormalizedOAuthProfile } from '../types/oauth-profile.type';
import { getOAuthProfile } from './oauth-http';

type KakaoProfile = {
  id: number;
  kakao_account?: {
    email?: string;
    is_email_verified?: boolean;
    profile?: {
      nickname?: string;
    };
  };
};

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://kauth.kakao.com/oauth/authorize',
      tokenURL: 'https://kauth.kakao.com/oauth/token',
      clientID:
        configService.get<string>('KAKAO_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('KAKAO_CLIENT_SECRET') || '',
      callbackURL: `${configService.get<string>(
        'API_BASE_URL',
        'http://localhost:8000',
      )}/auth/oauth/kakao/callback`,
    });
  }

  userProfile(
    accessToken: string,
    done: (error: Error | null, profile?: KakaoProfile) => void,
  ) {
    getOAuthProfile<KakaoProfile>(
      'https://kapi.kakao.com/v2/user/me',
      accessToken,
    ).then((profile) => done(null, profile), done);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: KakaoProfile,
  ): NormalizedOAuthProfile {
    return {
      provider: OAuthProvider.KAKAO,
      providerId: String(profile.id),
      email: profile.kakao_account?.email,
      emailVerified: profile.kakao_account?.is_email_verified === true,
      displayName: profile.kakao_account?.profile?.nickname,
    };
  }
}
