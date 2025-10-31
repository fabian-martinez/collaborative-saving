import { Email } from '../value-objects/email.value-object';
import { Phone } from '../value-objects/phone.value-object';
import { MemberStatus } from '../value-objects/member-status.value-object';
import { randomUUID } from 'crypto';

export class Member {
  constructor(
    public readonly id: string,
    private _name: string,
    private _email: Email,
    private _status: MemberStatus,
    private _role: string,
    public readonly registrationDate: Date,
    public readonly createdAt: Date,
    private _identificationNumber?: string,
    private _address?: string,
    private _phone?: Phone,
    private _beneficiary?: string,
  ) {}

  static create(data: {
    name: string;
    email: string;
    role?: string;
    identificationNumber?: string;
    address?: string;
    phone?: string;
    beneficiary?: string;
  }): Member {
    const id = randomUUID();
    return new Member(
      id,
      data.name,
      Email.create(data.email),
      MemberStatus.ACTIVE,
      data.role || 'member',
      new Date(), // registrationDate
      new Date(), // createdAt
      data.identificationNumber,
      data.address,
      Phone.create(data.phone),
      data.beneficiary,
    );
  }

  static fromPersistence(data: {
    id: string;
    name: string;
    email: string;
    status: string;
    role: string;
    identificationNumber?: string | null;
    address?: string | null;
    phone?: string | null;
    beneficiary?: string | null;
    registrationDate: Date | string;
    createdAt?: Date | string;
  }): Member {
    return new Member(
      data.id,
      data.name,
      Email.create(data.email),
      MemberStatus.fromString(data.status),
      data.role,
      typeof data.registrationDate === 'string'
        ? new Date(data.registrationDate)
        : data.registrationDate,
      data.createdAt
        ? typeof data.createdAt === 'string'
          ? new Date(data.createdAt)
          : data.createdAt
        : new Date(),
      data.identificationNumber ?? undefined,
      data.address ?? undefined,
      Phone.create(data.phone ?? undefined),
      data.beneficiary ?? undefined,
    );
  }

  update(data: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
    beneficiary?: string;
    role?: string;
    identificationNumber?: string;
  }): void {
    if (data.name) this._name = data.name;
    if (data.email) this._email = Email.create(data.email);
    if (data.address !== undefined) this._address = data.address;
    if (data.phone !== undefined) {
      this._phone = data.phone ? Phone.create(data.phone) : undefined;
    }
    if (data.beneficiary !== undefined) this._beneficiary = data.beneficiary;
    if (data.role) this._role = data.role;
    if (data.identificationNumber !== undefined) {
      this._identificationNumber = data.identificationNumber;
    }
  }

  markAsDeleted(): void {
    this._status = MemberStatus.INACTIVE;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email.value;
  }

  get status(): string {
    return this._status.value;
  }

  get role(): string {
    return this._role;
  }

  get identificationNumber(): string | undefined {
    return this._identificationNumber;
  }

  get address(): string | undefined {
    return this._address;
  }

  get phone(): string | undefined {
    return this._phone?.value;
  }

  get beneficiary(): string | undefined {
    return this._beneficiary;
  }

  isActive(): boolean {
    return this._status.isActive();
  }
}
