export class MemberStatus {
  static readonly ACTIVE = new MemberStatus('active');
  static readonly INACTIVE = new MemberStatus('inactive');

  private constructor(public readonly value: string) {}

  static fromString(value: string): MemberStatus {
    if (value === 'active') return MemberStatus.ACTIVE;
    if (value === 'inactive') return MemberStatus.INACTIVE;
    throw new Error(`Invalid member status: ${value}`);
  }

  isActive(): boolean {
    return this === MemberStatus.ACTIVE;
  }
}
