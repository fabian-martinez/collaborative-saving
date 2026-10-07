/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stocksApi } from './stocks.api';
import apiClient from './client';

describe('stocksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStocks should request GET /v2/stocks', async () => {
    const mockStocks = [
      {
        id: 'stock-1',
        name: 'Acción Grande',
        type: 'Acción Grande',
        value: 500000,
        monthly_contribution: 25000,
      },
      {
        id: 'stock-2',
        name: 'Acción Pequeña',
        type: 'Acción Pequeña',
        value: 190000,
        monthly_contribution: 10000,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockStocks });

    const result = await stocksApi.getStocks();

    expect(getSpy).toHaveBeenCalledWith('/v2/stocks');
    expect(result).toEqual(mockStocks);
  });

  it('getStockById should request GET /v2/stocks/:id', async () => {
    const mockStock = {
      id: 'stock-1',
      name: 'Acción Grande',
      type: 'Acción Grande',
      value: 500000,
      monthly_contribution: 25000,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: mockStock });

    const result = await stocksApi.getStockById('stock-1');

    expect(getSpy).toHaveBeenCalledWith('/v2/stocks/stock-1');
    expect(result).toEqual(mockStock);
  });
});
