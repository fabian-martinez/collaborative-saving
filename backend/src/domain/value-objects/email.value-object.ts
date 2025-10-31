export class Email {
  constructor(public readonly value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  private isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
