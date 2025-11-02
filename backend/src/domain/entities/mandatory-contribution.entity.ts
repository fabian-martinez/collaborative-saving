import { AssetType } from '../value-objects/asset-type.value-object';
import { randomUUID } from 'crypto';

export class MandatoryContribution {
  constructor(
    public readonly id: string,
    private _assetType: AssetType,
    private _value: number,
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
    return new MandatoryContribution(
      id,
      AssetType.create(data.assetType),
      data.value,
    );
  }

  static fromPersistence(data: {
    id: string;
    assetType: string;
    value: number;
  }): MandatoryContribution {
    return new MandatoryContribution(
      data.id,
      AssetType.create(data.assetType),
      data.value,
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
  }

  get assetType(): string {
    return this._assetType.value;
  }

  get value(): number {
    return this._value;
  }
}
