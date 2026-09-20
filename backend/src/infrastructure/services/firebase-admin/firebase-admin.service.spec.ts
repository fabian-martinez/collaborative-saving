/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { FirebaseAdminService } from './firebase-admin.service';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(),
}));

describe('FirebaseAdminService', () => {
  let service: FirebaseAdminService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (admin.apps as unknown as unknown[]).length = 0;
    service = new FirebaseAdminService();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should initialize using FIREBASE_SERVICE_ACCOUNT_JSON if provided', () => {
    // ARRANGE
    const mockCredentials = { project_id: 'test-project' };
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(mockCredentials);

    // ACT
    service.onModuleInit();

    // ASSERT
    expect(admin.credential.cert).toHaveBeenCalledWith(mockCredentials);
    expect(admin.initializeApp).toHaveBeenCalled();
  });

  it('should fallback to default credentials if FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON', () => {
    // ARRANGE
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = 'invalid json {';

    // ACT
    service.onModuleInit();

    // ASSERT
    expect(admin.initializeApp).toHaveBeenCalled();
  });

  it('should initialize using default credentials if FIREBASE_SERVICE_ACCOUNT_JSON is not provided', () => {
    // ARRANGE
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // ACT
    service.onModuleInit();

    // ASSERT
    expect(admin.initializeApp).toHaveBeenCalledWith();
  });

  it('should return admin.auth() when auth getter is accessed', () => {
    // ARRANGE
    const mockAuthInstance = {} as admin.auth.Auth;
    (admin.auth as unknown as jest.Mock).mockReturnValue(mockAuthInstance);

    // ACT
    const auth = service.auth;

    // ASSERT
    expect(auth).toBe(mockAuthInstance);
  });
});
