/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserDto } from '@application/queries/auth/get-authenticated-user.query';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUserDto | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserDto }>();
    return request.user;
  },
);
