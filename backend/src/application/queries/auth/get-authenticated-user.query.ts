import { IdentityService } from '@domain/ports/services/identity.service.port';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

export interface AuthenticatedUserDto {
  id: string;
  email: string;
  role: string;
}

export class GetAuthenticatedUserQuery {
  constructor(
    private readonly identityService: IdentityService,
    private readonly memberRepository: MemberRepository,
  ) {}

  async execute(token: string): Promise<AuthenticatedUserDto | null> {
    const externalIdentity = await this.identityService.getIdentity(token);
    if (!externalIdentity) {
      return null;
    }

    const member = await this.memberRepository.findByEmail(externalIdentity.email);
    if (!member) {
      return null;
    }

    return {
      id: member.id,
      email: member.email,
      role: member.role,
    };
  }
}
