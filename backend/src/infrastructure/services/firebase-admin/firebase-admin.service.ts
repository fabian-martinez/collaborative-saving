import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
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
          console.log(
            '[FirebaseAdminService] Initialized using FIREBASE_SERVICE_ACCOUNT_JSON env variable.',
          );
        } catch (error) {
          console.error(
            '[FirebaseAdminService] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON, falling back to default:',
            error,
          );
          admin.initializeApp();
        }
      } else {
        admin.initializeApp();
        console.log(
          '[FirebaseAdminService] Initialized using default credentials (GOOGLE_APPLICATION_CREDENTIALS).',
        );
      }
    }
  }

  get auth() {
    return admin.auth();
  }
}
