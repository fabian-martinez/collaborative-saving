/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { AuthenticatedMemberResponseDto } from '../../dto/auth/authenticated-member-response.dto';

export interface GetAuthenticatedMemberQuery {
  email: string;
}

export class GetAuthenticatedMemberQueryHandler {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    query: GetAuthenticatedMemberQuery,
  ): Promise<AuthenticatedMemberResponseDto> {
    const normalizedEmail = query.email ? query.email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const member = await this.memberRepository.findByEmail(normalizedEmail);

    if (!member) {
      throw new Error('Member not found');
    }

    if (!member.isActive()) {
      throw new Error('Member is not active');
    }

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      identificationNumber: member.identificationNumber,
      phone: member.phone,
      address: member.address,
      beneficiary: member.beneficiary,
      registrationDate: member.registrationDate,
      createdAt: member.createdAt,
    };
  }
}
