import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const SPECIAL_TARGET_LOAN_IDS = ['new_action_loan', 'new_current_loan'];

export function IsValidTargetLoanId(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: Record<string, unknown>, propertyName: string) {
    registerDecorator({
      name: 'isValidTargetLoanId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === null || value === undefined) {
            return true;
          }
          if (typeof value !== 'string') {
            return false;
          }
          if (SPECIAL_TARGET_LOAN_IDS.includes(value)) {
            return true;
          }
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return uuidRegex.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid UUID or one of: ${SPECIAL_TARGET_LOAN_IDS.join(', ')}`;
        },
      },
    });
  };
}
