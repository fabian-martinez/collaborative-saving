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

  async createUser(email: string, displayName: string): Promise<void> {
    try {
      await this.firebaseAdminService.auth.createUser({
        email,
        displayName,
      });
      console.log(
        `[FirebaseIdentityService] User ${email} created successfully in Firebase Auth.`,
      );
    } catch (error) {
      const err = error as { code?: string };
      // Si el usuario ya existe en Firebase, lo advertimos pero no interrumpimos el flujo
      if (err && err.code === 'auth/email-already-exists') {
        console.warn(
          `[FirebaseIdentityService] User ${email} already exists in Firebase Auth. Skipping creation.`,
        );
        return;
      }
      console.error(
        `[FirebaseIdentityService] Failed to create user ${email} in Firebase Auth:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
