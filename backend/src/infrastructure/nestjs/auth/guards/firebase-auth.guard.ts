import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAdminService } from '../../../services/firebase-admin/firebase-admin.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { MEMBER_REPOSITORY } from '@domain/constants/injection-tokens';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private firebaseAdminService: FirebaseAdminService,
    @Inject(MEMBER_REPOSITORY) private memberRepository: MemberRepository,
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
      const payload = await this.firebaseAdminService.auth.verifyIdToken(token);
      request['user'] = payload;

      if (payload.email) {
        const member = await this.memberRepository.findByEmail(payload.email);
        if (member) {
          request['user'].role = member.role;
          request['user'].memberId = member.id;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[FirebaseAuthGuard] Token verification failed:', message);
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Record<string, any>): string | undefined {
    const headers = request.headers as Record<string, string | string[] | undefined> | undefined;
    const authorization = headers?.authorization;
    if (!authorization || typeof authorization !== 'string') {
      return undefined;
    }
    const [type, token] = authorization.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
