export class Phone {
  constructor(public readonly value: string) {
    if (value && !this.isValid(value)) {
      throw new Error(`Invalid phone format: ${value}`);
    }
  }

  static create(value: string | undefined): Phone | undefined {
    if (!value) return undefined;
    return new Phone(value);
  }

  private isValid(value: string): boolean {
    // Remove common formatting characters: spaces, dashes, parentheses
    let cleaned = value.replace(/[\s\-()]/g, '');

    // Handle extensions: x123, ext123, extension123, #123 (with or without spaces)
    // Match: optional space, (x|ext|extension|#), optional space, digits
    cleaned = cleaned.replace(/\s*(x|ext|extension|#)\s*\d+/i, '');

    // Also handle extensions that might already be concatenated: 3582309057x6373
    cleaned = cleaned.replace(/(x|ext|extension|#)\d+$/i, '');

    // Check if remaining is valid phone number (7-15 digits, optional + prefix)
    return /^\+?[\d]{7,15}$/.test(cleaned);
  }

  get formatted(): string {
    // Return cleaned version without extensions for consistency
    let cleaned = this.value.replace(/[\s\-()]/g, '');
    cleaned = cleaned.replace(/\s*(x|ext|extension|#)\s*\d+/i, '');
    cleaned = cleaned.replace(/(x|ext|extension|#)\d+$/i, '');
    return cleaned;
  }
}
