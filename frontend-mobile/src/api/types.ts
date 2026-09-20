/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiError {
  statusCode?: number;
  message: string | string[];
  error?: string;
  errors?: Record<string, string[]> | string[];
  timestamp?: string;
  path?: string;
}

export class ApiException extends Error {
  public status: number;
  public errors?: Record<string, string[]> | string[];

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]> | string[]
  ) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}
