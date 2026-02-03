import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { GetAuthenticatedUserQuery } from '@application/queries/auth/get-authenticated-user.query';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly getAuthenticatedUserQuery: GetAuthenticatedUserQuery,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Record<string, any>>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      console.error('[FirebaseAuthGuard] No token found in request headers');
      throw new UnauthorizedException();
    }

    try {
      const user = await this.getAuthenticatedUserQuery.execute(token);
      if (!user) {
        throw new UnauthorizedException();
      }
      request['user'] = user;
    } catch (error) {
      console.error(
        '[FirebaseAuthGuard] Authentication failed:',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(
    request: Record<string, any>,
  ): string | undefined {
    const headers = request.headers as
      | Record<string, string | string[] | undefined>
      | undefined;
    const authorization = headers?.authorization;
    if (!authorization || typeof authorization !== 'string') {
      return undefined;
    }
    const [type, token] = authorization.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
