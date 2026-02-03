import { Injectable } from '@nestjs/common';
import {
  IdentityService,
  ExternalUserIdentity,
} from '@domain/ports/services/identity.service.port';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';

@Injectable()
export class FirebaseIdentityService implements IdentityService {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  async getIdentity(token: string): Promise<ExternalUserIdentity | null> {
    try {
      const payload = await this.firebaseAdminService.auth.verifyIdToken(token);
      if (!payload.email) {
        return null;
      }
      return {
        email: payload.email,
      };
    } catch (error) {
      console.error(
        '[FirebaseIdentityService] Token verification failed:',
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }
}
