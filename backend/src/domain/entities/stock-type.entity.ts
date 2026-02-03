import { StockBehavior } from './stock.entity';

export class StockType {
  constructor(
    public readonly id: string,
    public name: string,
    public isGuaranteed: boolean,
    public guaranteedYield: number | null,
    public behavior: StockBehavior,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    id: string;
    name: string;
    isGuaranteed: boolean;
    guaranteedYield: number | null;
    behavior: StockBehavior;
  }): StockType {
    return new StockType(data.id, data.name, data.isGuaranteed, data.guaranteedYield, data.behavior);
  }

  update(data: {
    name?: string;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    behavior?: StockBehavior;
  }): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.isGuaranteed !== undefined) this.isGuaranteed = data.isGuaranteed;
    if (data.guaranteedYield !== undefined) this.guaranteedYield = data.guaranteedYield;
    if (data.behavior !== undefined) this.behavior = data.behavior;

    this.validateInvariants();
  }

  private validateInvariants() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Stock type name is required');
    }
    if (!this.behavior) {
      throw new Error('Stock type behavior is required');
    }
    if (
      this.isGuaranteed &&
      this.guaranteedYield !== null &&
      this.guaranteedYield < 0
    ) {
      throw new Error('Guaranteed yield must be >= 0 when stock is guaranteed');
    }
  }
}
