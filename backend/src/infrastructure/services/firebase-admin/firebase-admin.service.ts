import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  onModuleInit() {
    if (!admin.apps.length) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(
            serviceAccountJson,
          ) as admin.ServiceAccount;
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.logger.log(
            'Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env variable.',
          );
        } catch (error) {
          this.logger.error(
            'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to default:',
            error instanceof Error ? error.stack : String(error),
          );
          admin.initializeApp();
        }
      } else {
        admin.initializeApp();
        this.logger.log(
          'Initialized using default credentials (GOOGLE_APPLICATION_CREDENTIALS).',
        );
      }
    }
  }

  get auth() {
    return admin.auth();
  }
}
