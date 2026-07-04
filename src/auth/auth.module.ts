import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';
import { GoogleStrategy } from './oauth/google.strategy';
import { NaverStrategy } from './oauth/naver.strategy';
import { KakaoStrategy } from './oauth/kakao.strategy';
import { OAuthStateService } from './oauth/oauth-state.service';
import {
  GoogleOAuthGuard,
  KakaoOAuthGuard,
  NaverOAuthGuard,
} from './oauth/oauth.guards';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-jwt-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    JwtStrategy,
    GoogleStrategy,
    NaverStrategy,
    KakaoStrategy,
    OAuthStateService,
    GoogleOAuthGuard,
    NaverOAuthGuard,
    KakaoOAuthGuard,
  ],
  exports: [AuthService],
})
export class AuthModule {}
