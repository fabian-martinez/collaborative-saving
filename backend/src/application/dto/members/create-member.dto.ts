/**
 * Create Member DTO
 *
 * Input DTO for creating a new member.
 */
export interface CreateMemberDto {
  name: string;
  email: string;
  role?: string;
  identificationNumber?: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
}
