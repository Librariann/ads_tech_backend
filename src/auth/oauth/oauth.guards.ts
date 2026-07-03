import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { OAuthProvider } from '../../users/entities/oauth-account.entity';
import { OAuthStateService } from './oauth-state.service';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly stateService: OAuthStateService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    this.validateCallback(context, OAuthProvider.GOOGLE);
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return this.getOptions(context, OAuthProvider.GOOGLE, [
      'openid',
      'profile',
      'email',
    ]);
  }

  private validateCallback(context: ExecutionContext, provider: OAuthProvider) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      this.stateService.validate(
        request,
        context.switchToHttp().getResponse<Response>(),
        provider,
      );
    }
  }

  private getOptions(
    context: ExecutionContext,
    provider: OAuthProvider,
    scope: string[],
  ) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      return { scope };
    }

    const response = context.switchToHttp().getResponse<Response>();
    return { scope, state: this.stateService.create(response, provider) };
  }
}

@Injectable()
export class NaverOAuthGuard extends AuthGuard('naver') {
  constructor(private readonly stateService: OAuthStateService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      this.stateService.validate(
        request,
        context.switchToHttp().getResponse<Response>(),
        OAuthProvider.NAVER,
      );
    }
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const scope = ['name', 'email'];
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      return { scope };
    }

    return {
      scope,
      state: this.stateService.create(
        context.switchToHttp().getResponse<Response>(),
        OAuthProvider.NAVER,
      ),
    };
  }
}

@Injectable()
export class KakaoOAuthGuard extends AuthGuard('kakao') {
  constructor(private readonly stateService: OAuthStateService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      this.stateService.validate(
        request,
        context.switchToHttp().getResponse<Response>(),
        OAuthProvider.KAKAO,
      );
    }
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const scope = ['profile_nickname', 'account_email'];
    const request = context.switchToHttp().getRequest<Request>();
    if (request.path.endsWith('/callback')) {
      return { scope };
    }

    return {
      scope,
      state: this.stateService.create(
        context.switchToHttp().getResponse<Response>(),
        OAuthProvider.KAKAO,
      ),
    };
  }
}
