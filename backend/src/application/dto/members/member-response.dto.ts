export class MemberResponseDto {
  id: string;
  name: string;
  email: string;
  role: string;
  identificationNumber?: string;
  status: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
  registrationDate: Date | string;
  createdAt?: Date | string;
}
