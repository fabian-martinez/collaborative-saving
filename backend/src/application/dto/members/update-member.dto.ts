/**
 * Update Member DTO
 *
 * Input DTO for updating an existing member.
 * All fields are optional.
 */
export interface UpdateMemberDto {
  memberId: string;
  name?: string;
  email?: string;
  role?: string;
  identificationNumber?: string;
  address?: string;
  phone?: string;
  beneficiary?: string;
}
