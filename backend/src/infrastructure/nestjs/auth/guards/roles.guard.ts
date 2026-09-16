import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MEMBER_REPOSITORY } from '../../../../domain/constants/injection-tokens';
import { MemberRepository } from '../../../../domain/ports/repositories/member-repository.port';
import { MemberRole } from '../../../../domain/enums/member-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { maskEmail } from '../../../utils/pii-masker.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(MEMBER_REPOSITORY) private memberRepository: MemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { email?: string } }>();
    // FirebaseAuthGuard puts the decoded token in request['user']
    // The decoded token has an 'email' property
    if (!user || typeof user.email !== 'string') {
      console.warn('RolesGuard: No user or email in request');
      return false;
    }

    const member = await this.memberRepository.findByEmail(user.email);
    if (!member) {
      console.warn(
        `RolesGuard: Member not found for email ${maskEmail(user.email)}`,
      );
      return false;
    }

    const hasRole = requiredRoles.includes(member.role as MemberRole);
    if (!hasRole) {
      console.warn(
        `RolesGuard: User ${maskEmail(user.email)} with role ${member.role} does not have required roles ${requiredRoles.join(', ')}`,
      );
    }
    return hasRole;
  }
}
