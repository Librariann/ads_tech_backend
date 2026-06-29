import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';
import { NormalizedOAuthProfile } from '../types/oauth-profile.type';
import { getOAuthProfile } from './oauth-http';

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: `${configService.get<string>(
        'API_BASE_URL',
        'http://localhost:8000',
      )}/auth/oauth/google/callback`,
    });
  }

  userProfile(
    accessToken: string,
    done: (error: Error | null, profile?: GoogleProfile) => void,
  ) {
    getOAuthProfile<GoogleProfile>(
      'https://openidconnect.googleapis.com/v1/userinfo',
      accessToken,
    ).then((profile) => done(null, profile), done);
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
  ): NormalizedOAuthProfile {
    return {
      provider: OAuthProvider.GOOGLE,
      providerId: profile.sub,
      email: profile.email,
      emailVerified: profile.email_verified,
      displayName: profile.name,
    };
  }
}
