export class CreateMemberDto {
  name: string;
  email: string;
  identificationNumber?: string;
  role?: 'member' | 'admin' | 'treasurer';
  address?: string;
  phone?: string;
  beneficiary?: string;
}
