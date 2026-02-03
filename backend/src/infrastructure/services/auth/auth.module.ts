import { Module } from '@nestjs/common';
import { FirebaseAdminModule } from '../firebase-admin/firebase-admin.module';
import { MembersV2Module } from '../../nestjs/http/modules/members-v2.module';
import { FirebaseIdentityService } from './firebase-identity.service';
import { GetAuthenticatedUserQuery } from '@application/queries/auth/get-authenticated-user.query';
import { IDENTITY_SERVICE } from '@domain/constants/injection-tokens';
import { MEMBER_REPOSITORY } from '@domain/constants/injection-tokens';
import { MemberRepository } from '@domain/ports/repositories/member-repository.port';
import { IdentityService } from '@domain/ports/services/identity.service.port';

@Module({
  imports: [FirebaseAdminModule, MembersV2Module],
  providers: [
    {
      provide: IDENTITY_SERVICE,
      useClass: FirebaseIdentityService,
    },
    {
      provide: GetAuthenticatedUserQuery,
      useFactory: (identityService: IdentityService, memberRepository: MemberRepository) => {
        return new GetAuthenticatedUserQuery(identityService, memberRepository);
      },
      inject: [IDENTITY_SERVICE, MEMBER_REPOSITORY],
    },
  ],
  exports: [GetAuthenticatedUserQuery],
})
export class AuthModule {}
