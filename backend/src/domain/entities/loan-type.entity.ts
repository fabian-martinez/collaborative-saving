/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { randomUUID } from 'crypto';

export class LoanType {
  constructor(
    public readonly id: string,
    private _code: string,
    private _name: string,
    private _interestRate: number,
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
    interestRate: number;
    description?: string | null;
  }): LoanType {
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

    const now = new Date();
    return new LoanType(
      id,
      code,
      data.name.trim(),
      data.interestRate,
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
    interest_rate: number | string;
    description?: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    deleted_at?: Date | string | null;
  }): LoanType {
    return new LoanType(
      data.id,
      data.code,
      data.name,
      Number(data.interest_rate),
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
    interestRate?: number;
    description?: string | null;
  }): void {
    if (data.name !== undefined) {
      this._name = data.name.trim();
    }
    if (data.interestRate !== undefined) {
      this._interestRate = data.interestRate;
    }
    if (data.description !== undefined) {
      this._description = data.description ? data.description.trim() : null;
    }
    this._updatedAt = new Date();
    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('LoanType id cannot be empty');
    }
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('LoanType name cannot be empty');
    }
    if (!this._code || this._code.trim().length === 0) {
      throw new Error('LoanType code cannot be empty');
    }
    if (this._interestRate < 0 || this._interestRate > 1) {
      throw new Error('LoanType interest rate must be between 0 and 1');
    }
  }

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get interestRate(): number {
    return this._interestRate;
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
