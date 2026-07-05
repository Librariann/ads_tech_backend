import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  GoogleOAuthGuard,
  KakaoOAuthGuard,
  NaverOAuthGuard,
} from './oauth/oauth.guards';
import { NormalizedOAuthProfile } from './types/oauth-profile.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() request) {
    await this.authService.logout(request.user.sessionId);
    return { loggedOut: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  async logoutAll(@Request() request) {
    await this.authService.logoutAll(request.user.id);
    return { loggedOut: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() request) {
    return {
      id: request.user.id,
      email: request.user.email,
      displayName: request.user.displayName,
    };
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('oauth/google')
  googleLogin() {
    return;
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('oauth/google/callback')
  googleCallback(
    @Request() request: { user: NormalizedOAuthProfile },
    @Res() response: Response,
  ) {
    return this.completeOAuth(request.user, response);
  }

  @UseGuards(NaverOAuthGuard)
  @Get('oauth/naver')
  naverLogin() {
    return;
  }

  @UseGuards(NaverOAuthGuard)
  @Get('oauth/naver/callback')
  naverCallback(
    @Request() request: { user: NormalizedOAuthProfile },
    @Res() response: Response,
  ) {
    return this.completeOAuth(request.user, response);
  }

  @UseGuards(KakaoOAuthGuard)
  @Get('oauth/kakao')
  kakaoLogin() {
    return;
  }

  @UseGuards(KakaoOAuthGuard)
  @Get('oauth/kakao/callback')
  kakaoCallback(
    @Request() request: { user: NormalizedOAuthProfile },
    @Res() response: Response,
  ) {
    return this.completeOAuth(request.user, response);
  }

  private async completeOAuth(
    profile: NormalizedOAuthProfile,
    response: Response,
  ) {
    const tokens = await this.authService.oauthLogin(profile);

    response.cookie(
      'access_token',
      tokens.accessToken,
      this.cookieOptions('JWT_EXPIRES_IN', '15m'),
    );
    response.cookie(
      'refresh_token',
      tokens.refreshToken,
      this.cookieOptions('REFRESH_TOKEN_EXPIRES_IN', '30d'),
    );

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    return response.redirect(302, frontendUrl);
  }

  private cookieOptions(durationKey: string, fallback: string): CookieOptions {
    const domain = this.configService.get<string>('AUTH_COOKIE_DOMAIN');
    const value = this.configService.get<string>(durationKey, fallback);

    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: this.parseDuration(value),
      ...(domain ? { domain } : {}),
    };
  }

  private parseDuration(value: string) {
    const match = /^(\d+)([smhd])?$/.exec(value);
    if (!match) {
      throw new Error(`Invalid token duration: ${value}`);
    }

    const amount = Number(match[1]);
    const unitMilliseconds = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * unitMilliseconds[match[2] || 's'];
  }
}
