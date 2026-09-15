/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { randomUUID } from 'crypto';
import { StockBehavior } from '../enums/stock-behavior.enum';

export class StockType {
  constructor(
    public readonly id: string,
    private _code: string,
    private _name: string,
    private _behavior: StockBehavior,
    private _isGuaranteed: boolean,
    private _guaranteedYield: number | null,
    private _description: string | null,
    private _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null,
  ) {
    this.validateInvariants();
  }

  static create(data: {
    name: string;
    code?: string;
    behavior?: StockBehavior;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    description?: string | null;
  }): StockType {
    const id = randomUUID();
    const rawCode =
      data.code && data.code.trim().length > 0 ? data.code : data.name;
    const code = rawCode
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    const isGuaranteed = data.isGuaranteed ?? false;
    const guaranteedYield = isGuaranteed
      ? data.guaranteedYield !== undefined && data.guaranteedYield !== null
        ? Number(data.guaranteedYield)
        : null
      : null;

    const behavior = data.behavior ?? StockBehavior.CAPITAL_APPRECIATION;
    const now = new Date();

    return new StockType(
      id,
      code,
      data.name.trim(),
      behavior,
      isGuaranteed,
      guaranteedYield,
      data.description?.trim() || null,
      now,
      now,
      null,
    );
  }

  static fromPersistence(data: {
    id: string;
    code: string;
    name: string;
    behavior: string | StockBehavior;
    is_guaranteed: boolean;
    guaranteed_yield?: number | string | null;
    description?: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    deleted_at?: Date | string | null;
  }): StockType {
    return new StockType(
      data.id,
      data.code,
      data.name,
      data.behavior as StockBehavior,
      Boolean(data.is_guaranteed),
      data.guaranteed_yield !== undefined && data.guaranteed_yield !== null
        ? Number(data.guaranteed_yield)
        : null,
      data.description ?? null,
      typeof data.created_at === 'string'
        ? new Date(data.created_at)
        : data.created_at,
      typeof data.updated_at === 'string'
        ? new Date(data.updated_at)
        : data.updated_at,
      data.deleted_at
        ? typeof data.deleted_at === 'string'
          ? new Date(data.deleted_at)
          : data.deleted_at
        : null,
    );
  }

  update(data: {
    name?: string;
    behavior?: StockBehavior;
    isGuaranteed?: boolean;
    guaranteedYield?: number | null;
    description?: string | null;
  }): void {
    if (data.name !== undefined) {
      this._name = data.name.trim();
    }
    if (data.behavior !== undefined) {
      this._behavior = data.behavior;
    }
    if (data.isGuaranteed !== undefined) {
      this._isGuaranteed = data.isGuaranteed;
      if (!data.isGuaranteed) {
        this._guaranteedYield = null;
      }
    }
    if (data.guaranteedYield !== undefined && this._isGuaranteed) {
      this._guaranteedYield =
        data.guaranteedYield !== null ? Number(data.guaranteedYield) : null;
    }
    if (data.description !== undefined) {
      this._description = data.description ? data.description.trim() : null;
    }
    this._updatedAt = new Date();
    this.validateInvariants();
  }

  markAsDeleted(): void {
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('StockType id cannot be empty');
    }
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('StockType name cannot be empty');
    }
    if (!this._code || this._code.trim().length === 0) {
      throw new Error('StockType code cannot be empty');
    }
    if (!Object.values(StockBehavior).includes(this._behavior)) {
      throw new Error(`Invalid stock behavior: ${this._behavior}`);
    }
    if (
      this._isGuaranteed &&
      this._guaranteedYield !== null &&
      (this._guaranteedYield < 0 || this._guaranteedYield > 1)
    ) {
      throw new Error(
        'StockType guaranteed yield must be between 0 and 1 when stock is guaranteed',
      );
    }
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get behavior(): StockBehavior {
    return this._behavior;
  }

  get isGuaranteed(): boolean {
    return this._isGuaranteed;
  }

  get guaranteedYield(): number | null {
    return this._guaranteedYield;
  }

  get description(): string | null {
    return this._description;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }
}
