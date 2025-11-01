export class AssetType {
  constructor(public readonly value: string) {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue || normalizedValue.length === 0) {
      throw new Error('Asset type cannot be empty');
    }
    // Store the normalized value
    (this as unknown as { value: string }).value = normalizedValue;
  }

  static create(value: string): AssetType {
    return new AssetType(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetType): boolean {
    return this.value === other.value;
  }
}
