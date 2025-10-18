import { faker } from '@faker-js/faker';
import { Member } from '../../src/members/entities/member.entity';

export class MemberFactory {
  static create(overrides: Partial<Member> = {}): Member {
    return {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      identificationNumber: faker.string.numeric(10),
      role: 'member',
      status: 'active',
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      beneficiary: faker.person.fullName(),
      registrationDate: faker.date.past(),
      deletedAt: null,
      ...overrides,
    } as Member;
  }

  static createMany(count: number, overrides: Partial<Member> = {}): Member[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createActive(overrides: Partial<Member> = {}): Member {
    return this.create({ status: 'active', ...overrides });
  }

  static createInactive(overrides: Partial<Member> = {}): Member {
    return this.create({ status: 'inactive', ...overrides });
  }

  static createAdmin(overrides: Partial<Member> = {}): Member {
    return this.create({ role: 'admin', ...overrides });
  }

  static createTreasurer(overrides: Partial<Member> = {}): Member {
    return this.create({ role: 'treasurer', ...overrides });
  }
}
