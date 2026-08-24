import { Member } from '../../entities/member.entity';

export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findByIds(ids: string[]): Promise<Member[]>;
  findByEmail(email: string): Promise<Member | null>;
  findActive(): Promise<Member[]>;
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
