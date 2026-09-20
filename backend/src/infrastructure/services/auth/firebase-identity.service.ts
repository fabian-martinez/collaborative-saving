import { Injectable, Logger } from '@nestjs/common';
import {
  IdentityService,
  ExternalUserIdentity,
} from '@domain/ports/services/identity.service.port';
import { FirebaseAdminService } from '../firebase-admin/firebase-admin.service';
import { maskEmail } from '../../utils/pii-masker.util';

@Injectable()
export class FirebaseIdentityService implements IdentityService {
  private readonly logger = new Logger(FirebaseIdentityService.name);

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
      this.logger.error(
        `Token verification failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
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
      this.logger.log(
        `User ${maskEmail(email)} created successfully in Firebase Auth.`,
      );
    } catch (error) {
      const err = error as { code?: string };
      // Si el usuario ya existe en Firebase, lo advertimos pero no interrumpimos el flujo
      if (err && err.code === 'auth/email-already-exists') {
        this.logger.warn(
          `User ${maskEmail(email)} already exists in Firebase Auth. Skipping creation.`,
        );
        return;
      }
      this.logger.error(
        `Failed to create user ${maskEmail(email)} in Firebase Auth: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
