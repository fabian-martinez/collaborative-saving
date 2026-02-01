import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@domain/enums/member-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MEMBER_REPOSITORY } from '@domain/constants/injection-tokens';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(MEMBER_REPOSITORY)
    private memberRepository: MemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.email) {
      // If authenticating via phone or other method without email, we need another way to link.
      // For now, assuming email link.
      throw new ForbiddenException('User email required for role verification');
    }

    const member = await this.memberRepository.findByEmail(user.email);
    if (!member) {
      throw new ForbiddenException('User is not a registered member');
    }

    if (!member.isActive()) {
      throw new ForbiddenException('Member is not active');
    }

    const hasRole = requiredRoles.some((role) => member.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
