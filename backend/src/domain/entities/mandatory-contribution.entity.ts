import { AssetType } from '../value-objects/asset-type.value-object';
import { randomUUID } from 'crypto';

export class MandatoryContribution {
  constructor(
    public readonly id: string,
    private _assetType: AssetType,
    private _value: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {
    if (_value <= 0) {
      throw new Error('Value must be greater than 0');
    }
  }

  static create(data: {
    assetType: string;
    value: number;
  }): MandatoryContribution {
    const id = randomUUID();
    const now = new Date();
    return new MandatoryContribution(
      id,
      AssetType.create(data.assetType),
      data.value,
      now, // createdAt
      now, // updatedAt
    );
  }

  static fromPersistence(data: {
    id: string;
    assetType: string;
    value: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  }): MandatoryContribution {
    return new MandatoryContribution(
      data.id,
      AssetType.create(data.assetType),
      data.value,
      typeof data.createdAt === 'string'
        ? new Date(data.createdAt)
        : data.createdAt,
      typeof data.updatedAt === 'string'
        ? new Date(data.updatedAt)
        : data.updatedAt,
    );
  }

  update(data: { assetType?: string; value?: number }): void {
    if (data.assetType !== undefined) {
      this._assetType = AssetType.create(data.assetType);
    }
    if (data.value !== undefined) {
      if (data.value <= 0) {
        throw new Error('Value must be greater than 0');
      }
      this._value = data.value;
    }
    this._updatedAt = new Date();
  }

  get assetType(): string {
    return this._assetType.value;
  }

  get value(): number {
    return this._value;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
