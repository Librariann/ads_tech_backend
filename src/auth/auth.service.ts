import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { SessionService } from './session.service';
import { NormalizedOAuthProfile } from './types/oauth-profile.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async signup(signupDto: SignupDto) {
    await this.sessionService.ensureAvailable();

    const passwordHash = await bcrypt.hash(signupDto.password, 12);
    const user = await this.usersService.create(signupDto, passwordHash);

    try {
      return await this.createAuthResponse(user.id, user.email);
    } catch (error) {
      await this.usersService.remove(user.id).catch(() => undefined);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user.id, user.email);
  }

  async oauthLogin(profile: NormalizedOAuthProfile) {
    await this.sessionService.ensureAvailable();

    const user = await this.usersService.findOrCreateOAuthUser(profile);
    return this.createAuthResponse(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    const session = await this.sessionService.rotate(refreshToken);
    return this.createTokenResponse(
      session.userId,
      session.email,
      session.sessionId,
      session.refreshToken,
    );
  }

  logout(sessionId: string) {
    return this.sessionService.revoke(sessionId);
  }

  logoutAll(userId: string) {
    return this.sessionService.revokeAll(userId);
  }

  private async createAuthResponse(userId: string, email: string) {
    const session = await this.sessionService.create(userId, email);
    return this.createTokenResponse(
      userId,
      email,
      session.sessionId,
      session.refreshToken,
    );
  }

  private createTokenResponse(
    userId: string,
    email: string,
    sessionId: string,
    refreshToken: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, sid: sessionId };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      tokenType: 'Bearer',
    };
  }
}
