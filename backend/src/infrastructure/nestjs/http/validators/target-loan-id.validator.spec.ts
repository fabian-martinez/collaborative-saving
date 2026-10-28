/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { validate } from 'class-validator';
import {
  IsValidTargetLoanId,
  SPECIAL_TARGET_LOAN_IDS,
} from './target-loan-id.validator';

class TestTargetLoanDto {
  @IsValidTargetLoanId()
  target_loan_id?: unknown;
}

describe('IsValidTargetLoanId', () => {
  it('should allow null or undefined values', async () => {
    // ARRANGE
    const dtoUndefined = new TestTargetLoanDto();
    const dtoNull = new TestTargetLoanDto();
    dtoNull.target_loan_id = null;

    // ACT
    const errorsUndefined = await validate(dtoUndefined);
    const errorsNull = await validate(dtoNull);

    // ASSERT
    expect(errorsUndefined).toHaveLength(0);
    expect(errorsNull).toHaveLength(0);
  });

  it('should allow special target loan IDs', async () => {
    for (const specialId of SPECIAL_TARGET_LOAN_IDS) {
      // ARRANGE
      const dto = new TestTargetLoanDto();
      dto.target_loan_id = specialId;

      // ACT
      const errors = await validate(dto);

      // ASSERT
      expect(errors).toHaveLength(0);
    }
  });

  it('should allow valid UUID v4 strings', async () => {
    // ARRANGE
    const dto = new TestTargetLoanDto();
    dto.target_loan_id = '550e8400-e29b-41d4-a716-446655440000';

    // ACT
    const errors = await validate(dto);

    // ASSERT
    expect(errors).toHaveLength(0);
  });

  it('should reject non-string values and return default error message', async () => {
    // ARRANGE
    const dto = new TestTargetLoanDto();
    dto.target_loan_id = 12345;

    // ACT
    const errors = await validate(dto);

    // ASSERT
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isValidTargetLoanId).toBe(
      `target_loan_id must be a valid UUID or one of: ${SPECIAL_TARGET_LOAN_IDS.join(', ')}`,
    );
  });

  it('should reject invalid string values that are neither UUID nor special IDs', async () => {
    // ARRANGE
    const dto = new TestTargetLoanDto();
    dto.target_loan_id = 'invalid-loan-id';

    // ACT
    const errors = await validate(dto);

    // ASSERT
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isValidTargetLoanId).toContain(
      'target_loan_id must be a valid UUID or one of:',
    );
  });
});
