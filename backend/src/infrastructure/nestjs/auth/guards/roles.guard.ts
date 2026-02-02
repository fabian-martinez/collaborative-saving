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

    const { user } = context.switchToHttp().getRequest();
    // FirebaseAuthGuard puts the decoded token in request['user']
    // The decoded token has an 'email' property
    if (!user || !user.email) {
      console.warn('RolesGuard: No user or email in request');
      return false;
    }

    const member = await this.memberRepository.findByEmail(user.email);
    if (!member) {
      console.warn(`RolesGuard: Member not found for email ${user.email}`);
      return false;
    }

    const hasRole = requiredRoles.includes(member.role as MemberRole);
    if (!hasRole) {
       console.warn(`RolesGuard: User ${user.email} with role ${member.role} does not have required roles ${requiredRoles}`);
    }
    return hasRole;
  }
}
