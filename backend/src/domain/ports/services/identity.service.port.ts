export interface ExternalUserIdentity {
  email: string;
}

export interface IdentityService {
  getIdentity(token: string): Promise<ExternalUserIdentity | null>;
  createUser(email: string, displayName: string): Promise<void>;
}
