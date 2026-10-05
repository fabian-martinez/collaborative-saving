/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { Module } from '@nestjs/common';
import { AuthV2Controller } from '../controllers/auth.v2.controller';
import { CheckMemberActiveUseCase } from '@application/use-cases/members/check-member-active.use-case';
import { GetAuthenticatedMemberQueryHandler } from '@application/queries/auth/get-authenticated-member.query-handler';
import { MembersV2Module } from './members-v2.module';
import { MEMBER_REPOSITORY } from '@domain/constants/injection-tokens';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';

@Module({
  imports: [MembersV2Module],
  controllers: [AuthV2Controller],
  providers: [
    {
      provide: CheckMemberActiveUseCase,
      useFactory: (memberRepository: MemberRepository) =>
        new CheckMemberActiveUseCase(memberRepository),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: GetAuthenticatedMemberQueryHandler,
      useFactory: (memberRepository: MemberRepository) =>
        new GetAuthenticatedMemberQueryHandler(memberRepository),
      inject: [MEMBER_REPOSITORY],
    },
  ],
  exports: [CheckMemberActiveUseCase, GetAuthenticatedMemberQueryHandler],
})
export class AuthV2Module {}
