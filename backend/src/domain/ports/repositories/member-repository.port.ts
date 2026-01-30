import { Member } from '../../entities/member.entity';

export interface MemberRepository {
  findById(id: string): Promise<Member | null>;
  findByEmail(email: string): Promise<Member | null>;
  findActive(): Promise<Member[]>;
  save(member: Member): Promise<Member>;
  softDelete(id: string): Promise<void>;
}
