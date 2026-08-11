import { HttpException, HttpStatus } from '@nestjs/common';
import { EntitlementResource } from '../database/entities/enums';

export enum EntitlementErrorCode {
  ACTIVE_SUBSCRIPTION_REQUIRED = 'ACTIVE_SUBSCRIPTION_REQUIRED',
  ENTITLEMENT_NOT_CONFIGURED = 'ENTITLEMENT_NOT_CONFIGURED',
  ENTITLEMENT_LIMIT_APPROACHING = 'ENTITLEMENT_LIMIT_APPROACHING',
  ENTITLEMENT_LIMIT_EXCEEDED = 'ENTITLEMENT_LIMIT_EXCEEDED',
}

export class ActiveSubscriptionRequiredException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: EntitlementErrorCode.ACTIVE_SUBSCRIPTION_REQUIRED,
        message: 'An active subscription is required',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

export class EntitlementNotConfiguredException extends HttpException {
  constructor(resource: EntitlementResource) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: EntitlementErrorCode.ENTITLEMENT_NOT_CONFIGURED,
        message: `Entitlement is not configured for ${resource}`,
        resource,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EntitlementLimitExceededException extends HttpException {
  constructor(
    resource: EntitlementResource,
    currentUsage: number,
    requestedQuantity: number,
    limit: number,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        code: EntitlementErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
        message: `The ${resource} plan limit has been exceeded`,
        resource,
        currentUsage,
        requestedQuantity,
        limit,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
