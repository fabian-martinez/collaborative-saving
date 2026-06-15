import { Module, Global } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { IDENTITY_SERVICE } from '@domain/constants/injection-tokens';
import { FirebaseIdentityService } from '../auth/firebase-identity.service';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    {
      provide: IDENTITY_SERVICE,
      useClass: FirebaseIdentityService,
    },
  ],
  exports: [FirebaseAdminService, IDENTITY_SERVICE],
})
export class FirebaseAdminModule {}
