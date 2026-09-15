/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { CheckMemberActiveDto } from '../../dto/members/check-member-active.dto';
import { CheckMemberActiveResponseDto } from '../../dto/members/check-member-active-response.dto';

export class CheckMemberActiveUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    dto: CheckMemberActiveDto,
  ): Promise<CheckMemberActiveResponseDto> {
    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return { exists: false, active: false };
    }

    const member = await this.memberRepository.findByEmail(normalizedEmail);

    if (!member) {
      return { exists: false, active: false };
    }

    return {
      exists: true,
      active: member.isActive(),
    };
  }
}
