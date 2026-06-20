import { OAuthProvider } from '../../users/entities/oauth-account.entity';

export type NormalizedOAuthProfile = {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
};
